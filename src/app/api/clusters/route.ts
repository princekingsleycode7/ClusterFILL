// src/app/api/clusters/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { initializeAdminApp, getAuth, getFirestore } from '@/lib/firebase-admin'; // We will create this file next
import { auth } from 'firebase-admin';

// Handler for POST requests to /api/clusters
export async function POST(req: NextRequest) {
  try {
    // 1. Initialize the Admin SDK
    initializeAdminApp();

    // 2. Authenticate the user making the request
    const idToken = req.headers.get('Authorization')?.split('Bearer ')[1];
    if (!idToken) {
      return NextResponse.json({ error: 'Unauthorized: No token provided' }, { status: 401 });
    }

    const decodedToken = await auth().verifyIdToken(idToken);
    const uid = decodedToken.uid;

    // 3. Define the new cluster data
    const newCluster = {
      status: "Pending",
      totalValue: 250,
      slots: 2,
      slotsFilled: 0,
      createdAt: new Date(), // Using a standard Date object
      createdBy: uid,
    };

    // 4. Add the document to Firestore
    const clusterRef = await getFirestore().collection('clusters').add(newCluster);

    // 5. Return success response
    return NextResponse.json({
      status: 'success',
      message: 'Cluster created successfully',
      clusterId: clusterRef.id,
    }, { status: 201 });

  } catch (error: any) {
    console.error("Error creating cluster:", error);
    // Distinguish between auth errors and other errors
    if (error.code === 'auth/id-token-expired' || error.code === 'auth/argument-error') {
      return NextResponse.json({ error: 'Unauthorized: Invalid token' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}