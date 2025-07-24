// src/app/admin/page.tsx

"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';

// We will create this component next
import MicroloanManager from '@/components/admin/MicroloanManager';

export default function AdminPage() {
  const { user, claims, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // This effect protects the route
    if (!loading) {
      if (!user || claims?.underwriter !== true) {
        // If not loading, not logged in, or not an underwriter, redirect away.
        router.push('/dashboard');
      }
    }
  }, [user, claims, loading, router]);

  // Show a loading state while we verify auth
  if (loading || !user || claims?.underwriter !== true) {
    return <div className="flex items-center justify-center min-h-screen">Verifying access...</div>;
  }

  // If checks pass, render the Admin Dashboard
  return (
    <div className="min-h-screen bg-gray-100">
      <header className="p-4 bg-white shadow-md">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800">Admin Dashboard</h1>
          <Link href="/dashboard" className="px-4 py-2 font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700">
            Go to User Dashboard
          </Link>
        </div>
      </header>
      <main className="container p-8 mx-auto">
        {/* The component for managing loans will go here */}
        <MicroloanManager />
      </main>
    </div>
  );
}