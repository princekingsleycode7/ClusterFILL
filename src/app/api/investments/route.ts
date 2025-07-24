// src/app/api/investments/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { initializeAdminApp } from '@/lib/firebase-admin';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { auth } from 'firebase-admin';

// Constants
const UNDERWRITER_INTEREST_RATE = 0.02;
const UNDERWRITER_PRINCIPAL = 250;

export async function POST(req: NextRequest) {
  try {
    initializeAdminApp();
    const db = getFirestore();
    const idToken = req.headers.get('Authorization')?.split('Bearer ')[1];
    if (!idToken) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    
    const { uid, email } = await auth().verifyIdToken(idToken);
    const { clusterId } = await req.json();
    if (!clusterId) return NextResponse.json({ error: 'Cluster ID required' }, { status: 400 });

    const clusterRef = db.collection('clusters').doc(clusterId);
    const investmentRef = clusterRef.collection('investments').doc(uid);
    const nftsCollection = db.collection('nfts');

    await db.runTransaction(async (transaction) => {
      // --- ALL READS MUST HAPPEN FIRST ---
      const clusterDoc = await transaction.get(clusterRef);
      if (!clusterDoc.exists) throw new Error("Cluster not found.");
      
      const investmentDoc = await transaction.get(investmentRef);
      // We also pre-read the list of existing investors
      const existingInvestmentsSnapshot = await transaction.get(clusterRef.collection('investments'));

      // --- VALIDATION LOGIC using the data we just read ---
      const clusterData = clusterDoc.data()!;
      if (clusterData.status !== 'Open') throw new Error("This cluster is not open for investment.");
      if (clusterData.slotsFilled >= clusterData.slots) throw new Error("This cluster is already full.");
      if (investmentDoc.exists) throw new Error("You have already invested in this cluster.");

      // --- ALL WRITES HAPPEN AFTER THIS POINT ---
      const newSlotsFilled = clusterData.slotsFilled + 1;
      
      // Write 1: Create the new investment document for the current user
      transaction.set(investmentRef, {
        userId: uid,
        userEmail: email,
        amount: 25,
        investedAt: FieldValue.serverTimestamp(),
      });
      
      // Write 2: Update the cluster's slot count
      transaction.update(clusterRef, { slotsFilled: newSlotsFilled });

      // --- NFT MINTING LOGIC (if the cluster is now full) ---
      if (newSlotsFilled === clusterData.slots) {
        // Write 3: Update cluster status to Active
        transaction.update(clusterRef, { status: 'Active', activatedAt: FieldValue.serverTimestamp() });

        // Write 4: Mint the Underwriter NFT
        const underwriterRepayment = UNDERWRITER_PRINCIPAL * (1 + UNDERWRITER_INTEREST_RATE);
        transaction.set(nftsCollection.doc(), {
          ownerId: clusterData.fundedBy,
          clusterId: clusterId,
          type: 'underwriter',
          entitlement: underwriterRepayment,
          status: 'pending_settlement',
          issuedAt: FieldValue.serverTimestamp(),
        });

        // Write 5-14: Mint NFTs for ALL investors
        // First, mint for the existing investors we read earlier
        existingInvestmentsSnapshot.docs.forEach(doc => {
          const investor = doc.data();
          transaction.set(nftsCollection.doc(), {
            ownerId: investor.userId,
            clusterId: clusterId,
            type: 'investor',
            entitlement: 0,
            status: 'pending_settlement',
            issuedAt: FieldValue.serverTimestamp(),
          });
        });
        
        // Then, mint for the CURRENT user who just invested
        transaction.set(nftsCollection.doc(), {
          ownerId: uid, // The current user's ID
          clusterId: clusterId,
          type: 'investor',
          entitlement: 0,
          status: 'pending_settlement',
          issuedAt: FieldValue.serverTimestamp(),
        });
      }
    });

    return NextResponse.json({ status: 'success', message: `Successfully invested in cluster ${clusterId}` });
  } catch (error: any) {
    console.error("Investment failed:", error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}