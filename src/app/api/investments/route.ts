// src/app/api/investments/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { initializeAdminApp } from '@/lib/firebase-admin';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { auth } from 'firebase-admin';
import { ethers } from 'ethers'; // Import ethers
import { clusterFiShareContract } from '@/lib/ethers-service'; // Import our contract instance

// Constants
const UNDERWRITER_INTEREST_RATE = 0.02;
const UNDERWRITER_PRINCIPAL = 250;

export async function POST(req: NextRequest) {
  try {
    initializeAdminApp();
    const db = getFirestore();
    const { uid, email } = await auth().verifyIdToken(req.headers.get('Authorization')?.split('Bearer ')[1]!);
    const { clusterId, investorWalletAddress } = await req.json(); // We now need the investor's wallet address

    if (!clusterId || !investorWalletAddress || !ethers.isAddress(investorWalletAddress)) {
      return NextResponse.json({ error: 'Cluster ID and a valid investor wallet address are required' }, { status: 400 });
    }

    const clusterRef = db.collection('clusters').doc(clusterId);
    
    // We can't do blockchain calls inside a Firestore transaction.
    // So, we'll commit to Firestore first, then mint.
    // In a production system, a failure in minting would require a compensating action.

    // Get all investors' data BEFORE the transaction
    const investmentsSnapshot = await db.collection('clusters').doc(clusterId).collection('investments').get();
    const investors = investmentsSnapshot.docs.map(doc => doc.data());

    // --- Firestore Transaction for Cluster Update ---
    await db.runTransaction(async (transaction) => {
      const clusterDoc = await transaction.get(clusterRef);
      if (!clusterDoc.exists) throw new Error("Cluster not found.");
      const clusterData = clusterDoc.data()!;
      if (clusterData.status !== 'Open') throw new Error("This cluster is not open for investment.");
      if (clusterData.slotsFilled >= clusterData.slots) throw new Error("This cluster is already full.");
      
      const investmentRef = clusterRef.collection('investments').doc(uid);
      const investmentDoc = await transaction.get(investmentRef);
      if (investmentDoc.exists) throw new Error("You have already invested in this cluster.");

      const newSlotsFilled = clusterData.slotsFilled + 1;
      
      transaction.set(investmentRef, { userId: uid, userEmail: email, amount: 25, investedAt: FieldValue.serverTimestamp(), walletAddress: investorWalletAddress });
      
      let updateData: { slotsFilled: number, status?: string, activatedAt?: FieldValue } = { slotsFilled: newSlotsFilled };
      if (newSlotsFilled === clusterData.slots) {
        updateData.status = 'Active';
        updateData.activatedAt = FieldValue.serverTimestamp();
      }
      transaction.update(clusterRef, updateData);
    });

    // --- ON-CHAIN NFT MINTING (happens after Firestore is updated) ---
    const updatedCluster = (await clusterRef.get()).data()!;
    if (updatedCluster.status === 'Active' && updatedCluster.slotsFilled === updatedCluster.slots) {
        console.log("Cluster is active, proceeding to mint NFTs on-chain...");

        const clusterIdBytes32 = ethers.encodeBytes32String(clusterId.substring(0, 31));

        // 1. Mint for the Underwriter (we need to fetch their wallet address)
        // For now, let's assume it's stored somewhere. In a real app, you'd fetch it.
        const underwriterWallet = "0x...UNDERWRITER_WALLET_ADDRESS"; // Placeholder
        const underwriterEntitlement = ethers.parseUnits((UNDERWRITER_PRINCIPAL * (1 + UNDERWRITER_INTEREST_RATE)).toFixed(2), 2); // e.g., 255.00 -> 25500
        
        const tx1 = await clusterFiShareContract.safeMint(underwriterWallet, clusterIdBytes32, 1, underwriterEntitlement); // 1 = UNDERWRITER
        await tx1.wait();
        console.log(`Minted Underwriter NFT. Tx: ${tx1.hash}`);

        // 2. Mint for all investors, including the current one
        for (const investor of investors) {
            const tx = await clusterFiShareContract.safeMint(investor.walletAddress, clusterIdBytes32, 0, 0); // 0 = INVESTOR
            await tx.wait(); // Wait for each transaction to be mined
            console.log(`Minted Investor NFT for ${investor.walletAddress}. Tx: ${tx.hash}`);
        }
        // Mint for the final investor
        const txFinal = await clusterFiShareContract.safeMint(investorWalletAddress, clusterIdBytes32, 0, 0);
        await txFinal.wait();
        console.log(`Minted final Investor NFT for ${investorWalletAddress}. Tx: ${txFinal.hash}`);
    }

    return NextResponse.json({ status: 'success', message: `Successfully invested in cluster ${clusterId}` });
  } catch (error: any) {
    console.error("On-chain minting failed:", error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}