// src/app/api/clusters/close/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { initializeAdminApp } from '@/lib/firebase-admin';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { auth } from 'firebase-admin';

export async function POST(req: NextRequest) {
  try {
    initializeAdminApp();
    const db = getFirestore();

    // 1. Authenticate and authorize the user as an admin/underwriter
    const idToken = req.headers.get('Authorization')?.split('Bearer ')[1];
    if (!idToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const decodedToken = await auth().verifyIdToken(idToken);
    if (decodedToken.underwriter !== true) { // Using underwriter as our admin role
      return NextResponse.json({ error: 'Forbidden: User does not have permission.' }, { status: 403 });
    }

    // 2. Get clusterId from the request body
    const { clusterId } = await req.json();
    if (!clusterId) {
      return NextResponse.json({ error: 'Cluster ID is required' }, { status: 400 });
    }

    const clusterRef = db.collection('clusters').doc(clusterId);
    
    // 3. Validate the cluster's current state
    const clusterDoc = await clusterRef.get();
    if (!clusterDoc.exists || clusterDoc.data()?.status !== 'Settling') {
      throw new Error('Only a cluster in the "Settling" state can be closed.');
    }

    // 4. Update the cluster's status to 'Closed'
    await clusterRef.update({
      status: 'Closed',
      closedAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({ status: 'success', message: 'Cluster has been closed.' });

  } catch (error: any) {
    console.error("Failed to close cluster:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}