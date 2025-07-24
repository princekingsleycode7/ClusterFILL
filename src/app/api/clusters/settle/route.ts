// src/app/api/clusters/settle/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { initializeAdminApp } from '@/lib/firebase-admin';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { auth } from 'firebase-admin';

// --- CONFIGURATION CONSTANTS ---
const UNDERWRITER_INTEREST_RATE = 0.02;
const PLATFORM_FEE_RATE = 0.20;
const UNDERWRITER_PRINCIPAL = 250;
const INVESTOR_SHARES = 10;

export async function POST(req: NextRequest) {
  try {
    initializeAdminApp();
    const db = getFirestore();
    const idToken = req.headers.get('Authorization')?.split('Bearer ')[1];
    if (!idToken) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const decodedToken = await auth().verifyIdToken(idToken);
    if (decodedToken.underwriter !== true) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { clusterId, tradeProfit } = await req.json();
    if (!clusterId || typeof tradeProfit !== 'number') {
      return NextResponse.json({ error: 'Cluster ID and tradeProfit are required' }, { status: 400 });
    }

    const clusterRef = db.collection('clusters').doc(clusterId);
    const nftsCollection = db.collection('nfts');

    await db.runTransaction(async (transaction) => {
      // --- READS FIRST ---
      const clusterDoc = await transaction.get(clusterRef);
      if (!clusterDoc.exists || clusterDoc.data()?.status !== 'Active') {
        throw new Error('Only an Active cluster can be settled.');
      }
      
      // NEW READ: Get all NFTs related to this cluster before writing
      const nftQuery = nftsCollection.where('clusterId', '==', clusterId);
      const nftSnapshot = await transaction.get(nftQuery);
      if (nftSnapshot.empty) {
        throw new Error("Could not find NFTs for this cluster. Cannot settle.");
      }

      // --- WRITES AND LOGIC AFTER THIS POINT ---
      // 1. Profit Calculation (same as before)
      const underwriterRepayment = UNDERWRITER_PRINCIPAL * (1 + UNDERWRITER_INTEREST_RATE);
      const profitAfterUnderwriter = tradeProfit - (underwriterRepayment - UNDERWRITER_PRINCIPAL);

      let platformFee = 0;
      let netProfitForInvestors = 0;
      if (profitAfterUnderwriter > 0) {
        platformFee = profitAfterUnderwriter * PLATFORM_FEE_RATE;
        netProfitForInvestors = profitAfterUnderwriter - platformFee;
      } else {
        netProfitForInvestors = profitAfterUnderwriter;
      }
      const profitPerInvestorShare = netProfitForInvestors / INVESTOR_SHARES;

      // 2. Create the settlement log document (same as before)
      const settlementRef = db.collection('settlements').doc(clusterId);
      transaction.set(settlementRef, {
        clusterId, totalProfit: tradeProfit, underwriterInterestRate: UNDERWRITER_INTEREST_RATE,
        underwriterPrincipal: UNDERWRITER_PRINCIPAL, underwriterRepayment, platformFeeRate: PLATFORM_FEE_RATE,
        platformFee, netProfitForInvestors, profitPerInvestorShare, settledAt: FieldValue.serverTimestamp(),
      });

      // 3. Update the cluster's status to 'Settling' (same as before)
      transaction.update(clusterRef, { status: 'Settling', profit: tradeProfit });

      // 4. --- NEW: UPDATE ALL NFTs for this cluster ---
      const settlementTimestamp = FieldValue.serverTimestamp(); // Use a consistent timestamp

      nftSnapshot.docs.forEach(doc => {
        const nftData = doc.data();
        const nftRef = nftsCollection.doc(doc.id);
        
        if (nftData.type === 'investor') {
          // For investors, update their entitlement and status
          transaction.update(nftRef, {
            entitlement: profitPerInvestorShare,
            status: 'claimable',
            settledAt: settlementTimestamp,
          });
        } else if (nftData.type === 'underwriter') {
          // For the underwriter, just update the status (entitlement was already set)
          transaction.update(nftRef, {
            status: 'claimable',
            settledAt: settlementTimestamp,
          });
        }
      });
    });

    return NextResponse.json({ status: 'success', message: 'Cluster settlement processed and NFTs updated.' });
  } catch (error: any) {
    console.error("Settlement failed:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}