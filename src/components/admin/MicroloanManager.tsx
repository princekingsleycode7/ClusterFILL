// src/components/admin/MicroloanManager.tsx

"use client";

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { Cluster, MicroloanCampaign } from '@/lib/types';

export default function MicroloanManager() {
  const { user } = useAuth();
  const [activeClusters, setActiveClusters] = useState<Cluster[]>([]);
  const [loanCampaigns, setLoanCampaigns] = useState<MicroloanCampaign[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Effect to fetch ONLY active clusters for the dropdown
  useEffect(() => {
    const q = query(collection(db, 'clusters'), where('status', '==', 'Active'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setActiveClusters(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Cluster)));
    });
    return () => unsubscribe();
  }, []);

  // Effect to fetch all loan campaigns to display in the list
  useEffect(() => {
    const q = query(collection(db, 'microloanCampaigns'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setLoanCampaigns(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MicroloanCampaign)));
    });
    return () => unsubscribe();
  }, []);

  const handleCreateCampaign = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) return;
    setIsSubmitting(true);
    
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());

    try {
      // In a real app, you'd have an API route for this. For simplicity as an admin tool,
      // we can write directly to the DB, but this requires adjusting security rules.
      // For now, we'll assume we will create an API route later.
      // Let's create the API route now for better security.
      const idToken = await user.getIdToken();
      const response = await fetch('/api/admin/loans', {
          method: 'POST',
          headers: {'Content-Type': 'application/json', 'Authorization': `Bearer ${idToken}`},
          body: JSON.stringify(data),
      });

      if (!response.ok) {
          const result = await response.json();
          throw new Error(result.error || 'Failed to create campaign');
      }

      alert('Campaign created successfully!');
      (e.target as HTMLFormElement).reset(); // Clear the form
      
    } catch (error) {
      console.error("Error creating campaign:", error);
      alert((error as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Column 1: Create Form */}
      <div className="p-6 bg-white rounded-lg shadow-lg lg:col-span-1">
        <h2 className="text-2xl font-bold mb-4">Create Loan Campaign</h2>
        <form onSubmit={handleCreateCampaign} className="space-y-4">
          <div>
            <label className="block text-sm font-medium">Borrower Group</label>
            <input name="borrowerGroup" required className="w-full mt-1 p-2 border rounded-md"/>
          </div>
          <div>
            <label className="block text-sm font-medium">Link to Active Cluster</label>
            <select name="clusterId" required className="w-full mt-1 p-2 border rounded-md">
              <option value="">Select a Cluster</option>
              {activeClusters.map(c => <option key={c.id} value={c.id}>Cluster #{c.id?.substring(0, 6)}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium">Description</label>
            <textarea name="description" required rows={3} className="w-full mt-1 p-2 border rounded-md"></textarea>
          </div>
           <div>
            <label className="block text-sm font-medium">Risk Rating</label>
            <select name="riskRating" required className="w-full mt-1 p-2 border rounded-md">
                <option value="A+">A+</option>
                <option value="A">A</option>
                <option value="B+">B+</option>
                <option value="B">B</option>
                <option value="C">C</option>
            </select>
          </div>
          <button type="submit" disabled={isSubmitting} className="w-full py-2 text-white bg-green-600 rounded-md hover:bg-green-700 disabled:bg-gray-400">
            {isSubmitting ? 'Creating...' : 'Create Campaign'}
          </button>
        </form>
      </div>

      {/* Column 2: List of Campaigns */}
      <div className="p-6 bg-white rounded-lg shadow-lg lg:col-span-2">
        <h2 className="text-2xl font-bold mb-4">Existing Campaigns</h2>
        <div className="space-y-4">
          {loanCampaigns.length === 0 ? <p>No campaigns created yet.</p> : loanCampaigns.map(loan => (
            <div key={loan.id} className="p-4 border rounded-md">
              <h3 className="font-bold">{loan.borrowerGroup}</h3>
              <p className="text-sm">Cluster: <span className="font-mono">{loan.clusterId.substring(0,6)}...</span></p>
              <p className="text-sm">Status: <span className="font-semibold">{loan.status}</span></p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}