// src/app/api/admin/loans/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { initializeAdminApp } from '@/lib/firebase-admin';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { auth } from 'firebase-admin';

export async function POST(req: NextRequest) {
  try {
    initializeAdminApp();
    const db = getFirestore();

    const idToken = req.headers.get('Authorization')?.split('Bearer ')[1];
    if (!idToken) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    
    const decodedToken = await auth().verifyIdToken(idToken);
    if (decodedToken.underwriter !== true) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { clusterId, borrowerGroup, description, riskRating } = await req.json();
    if (!clusterId || !borrowerGroup || !description || !riskRating) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const clusterRef = db.collection('clusters').doc(clusterId);
    const clusterDoc = await clusterRef.get();

    if (!clusterDoc.exists || clusterDoc.data()?.status !== 'Active') {
      return NextResponse.json({ error: 'Cannot link a loan to this cluster.' }, { status: 400 });
    }

    // Create the new campaign document
    await db.collection('microloanCampaigns').add({
        clusterId,
        borrowerGroup,
        description,
        riskRating,
        loanAmount: 250, // Fixed based on cluster size
        durationMonths: 2, // Example value
        repaymentPlan: "8 weekly installments", // Example value
        status: 'Active', // Starts as Active once created
        repaidAmount: 0,
        createdAt: FieldValue.serverTimestamp(),
    });

    // Optional: Update the cluster to link it to the loan
    await clusterRef.update({ hasLoanAssigned: true });

    return NextResponse.json({ status: 'success' });
  } catch (error: any) {
    console.error("Failed to create loan campaign:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}