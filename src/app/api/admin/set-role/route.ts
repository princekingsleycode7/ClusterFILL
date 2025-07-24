// src/app/api/admin/set-role/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { initializeAdminApp } from '@/lib/firebase-admin';
import { auth } from 'firebase-admin';

export async function POST(req: NextRequest) {
  try {
    initializeAdminApp();

    // In a real app, you'd protect this endpoint with another layer of security
    // (e.g., check if the CALLER is an admin). For now, it's an open admin tool.
    const { email, role } = await req.json();

    if (!email || !role) {
      return NextResponse.json({ error: 'Email and role are required' }, { status: 400 });
    }

    // Get the user by email
    const user = await auth().getUserByEmail(email);

    // Set the custom claim. This will overwrite any existing claims.
    await auth().setCustomUserClaims(user.uid, { [role]: true });

    return NextResponse.json({
      status: 'success',
      message: `Successfully set role '${role}' for user ${email}.`,
    });

  } catch (error: any) {
    console.error("Failed to set role:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}