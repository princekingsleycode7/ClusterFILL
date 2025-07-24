// functions/src/index.ts

import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

// Import the specific type for our function's context
import { CallableContext } from "firebase-functions/v1/https";

admin.initializeApp();
const db = admin.firestore();

/**
 * Creates a new investment cluster with default values.
 * This function can only be called by an authenticated user.
 */
// Add the type annotation here: context: CallableContext
export const createCluster = functions.https.onCall(async (data: any, context: CallableContext) => {
  // 1. Authentication Check: TypeScript now understands context.auth
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "You must be logged in to create a cluster.",
    );
  }

  // 2. Define the new cluster data on the server.
  const newCluster = {
    status: "Pending",
    totalValue: 250,
    slots: 10,
    slotsFilled: 0,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    // TypeScript now knows context.auth.uid is a valid string
    createdBy: context.auth.uid,
  };

  // 3. Add the document to Firestore.
  const clusterRef = await db.collection("clusters").add(newCluster);

  // 4. Return a success message with the new cluster's ID.
  return {
    status: "success",
    message: "Cluster created successfully",
    clusterId: clusterRef.id,
  };
});