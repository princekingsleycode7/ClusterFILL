// src/app/api/clusters/fund/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { initializeAdminApp } from '@/lib/firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';
import { auth } from 'firebase-admin';

export async function POST(req: NextRequest) {
  try {
    initializeAdminApp();

    // 1. Authenticate the user and, critically, check their role
    const idToken = req.headers.get('Authorization')?.split('Bearer ')[1];
    if (!idToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decodedToken = await auth().verifyIdToken(idToken);
    // ROLE CHECK: Does the user have the 'underwriter' claim?
    if (decodedToken.underwriter !== true) {
      return NextResponse.json({ error: 'Forbidden: User is not an underwriter.' }, { status: 403 });
    }
    
    // 2. Get the clusterId from the request body
    const { clusterId } = await req.json();
    if (!clusterId) {
      return NextResponse.json({ error: 'Cluster ID is required' }, { status: 400 });
    }

    const clusterRef = getFirestore().collection('clusters').doc(clusterId);
    const clusterDoc = await clusterRef.get();

    if (!clusterDoc.exists || clusterDoc.data()?.status !== 'Pending') {
        return NextResponse.json({ error: 'Cluster cannot be funded.' }, { status: 400 });
    }

    // 3. Update the cluster status
    await clusterRef.update({
      status: 'Open', // Change status from 'Pending' to 'Open'
      fundedBy: decodedToken.uid, // Track who funded it
      fundedAt: new Date(),
    });

    return NextResponse.json({ status: 'success', message: `Cluster ${clusterId} is now Open.` });

  } catch (error: any) {
    console.error("Funding failed:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}