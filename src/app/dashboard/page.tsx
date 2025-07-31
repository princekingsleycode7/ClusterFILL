"use client";

// --- ALL IMPORTS AT THE TOP ---
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { auth, db } from '@/lib/firebase';
import { signOut } from 'firebase/auth';
import { ethers } from 'ethers';
import { collection, query, onSnapshot, where } from 'firebase/firestore';
import { Cluster, MicroloanCampaign, ClusterNFT } from '@/lib/types';
import NftCard from '@/components/NftCard';
import ClusterCard from '@/components/ClusterCard';
// In your dashboard component
import { ConnectKitButton } from 'connectkit';
import { useAccount } from 'wagmi';


import { ConnectButton } from '@rainbow-me/rainbowkit';

export default function DashboardPage() {
  // --- STATE MANAGEMENT ---
  const { user, claims, loading } = useAuth();
  const router = useRouter();
  const [clusters, setClusters] = useState<Cluster[]>([]);
  const [myNfts, setMyNfts] = useState<ClusterNFT[]>([]);
  const [loanCampaigns, setLoanCampaigns] = useState<MicroloanCampaign[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [actionInProgressId, setActionInProgressId] = useState<string | null>(null);
  const { address, isConnected } = useAccount();
  // --- DATA FETCHING HOOKS ---
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (!user) return;

    // Set up real-time listeners for all necessary collections
    const qClusters = query(collection(db, 'clusters'));
    const unsubClusters = onSnapshot(qClusters, (snap) => {
      setClusters(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Cluster)));
    });

    // Fetches NFTs owned by the current user (from our old off-chain system)
    const qNfts = query(collection(db, 'nfts'), where('ownerId', '==', user.uid));
    const unsubNfts = onSnapshot(qNfts, (snap) => {
      setMyNfts(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as ClusterNFT)));
    });

    // Fetches all loan campaigns for display
    const qLoans = query(collection(db, 'microloanCampaigns'));
    const unsubLoans = onSnapshot(qLoans, (snap) => {
      setLoanCampaigns(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as MicroloanCampaign)));
    });

    // Cleanup function to detach listeners when the component unmounts
    return () => {
      unsubClusters();
      unsubNfts();
      unsubLoans();
    };
  }, [user]);

  // --- API HANDLER FUNCTIONS ---

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const handleCreateCluster = async () => {
    if (!user) return;
    setIsCreating(true);
    try {
      const idToken = await user.getIdToken();
      const response = await fetch('/api/clusters', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${idToken}` },
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Failed to create cluster');
    } catch (error) {
      console.error("Error creating cluster:", error);
      alert((error as Error).message);
    } finally {
      setIsCreating(false);
    }
  };

  const handleFundCluster = async (clusterId: string) => {
    if (!user) return;
    setActionInProgressId(clusterId);
    try {
      const idToken = await user.getIdToken();
      const response = await fetch('/api/clusters/fund', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${idToken}` },
        body: JSON.stringify({ clusterId }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      alert('Cluster funded successfully!');
    } catch (error) {
      console.error("Error funding cluster:", error);
      alert((error as Error).message);
    } finally {
      setActionInProgressId(null);
    }
  };

  const handleInvest = async (clusterId: string) => {
    if (!user) return;
    const walletAddress = prompt("This is a temporary step for V2:\nPlease enter your Ethereum (Sepolia) wallet address to receive your NFT share (e.g., 0x...):");
    if (!walletAddress || !ethers.isAddress(walletAddress)) {
      alert("Invalid wallet address provided.");
      return;
    }
    setActionInProgressId(clusterId);
    try {
      const idToken = await user.getIdToken();
      const response = await fetch('/api/investments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${idToken}` },
        body: JSON.stringify({ clusterId, investorWalletAddress: walletAddress }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Failed to invest.');
      alert('Investment successful! Your on-chain NFT will be minted. Check the server logs and Etherscan.');
    } catch (error) {
      console.error("Error investing:", error);
      alert((error as Error).message);
    } finally {
      setActionInProgressId(null);
    }
  };

  const handleSettleCluster = async (e: React.FormEvent<HTMLFormElement>, clusterId: string) => {
    e.preventDefault();
    if (!user) return;
    const formData = new FormData(e.currentTarget);
    const profit = formData.get('profit');
    if (profit === null || profit === '') {
      alert('Please enter a profit amount.');
      return;
    }
    setActionInProgressId(clusterId);
    try {
      const idToken = await user.getIdToken();
      const response = await fetch('/api/clusters/settle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${idToken}` },
        body: JSON.stringify({ clusterId, tradeProfit: parseFloat(profit.toString()) }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      alert('Cluster settlement successful!');
    } catch (error) {
      console.error("Error settling cluster:", error);
      alert((error as Error).message);
    } finally {
      setActionInProgressId(null);
    }
  };

  const handleCloseCluster = async (clusterId: string) => {
    if (!user) return;
    setActionInProgressId(clusterId);
    try {
      const idToken = await user.getIdToken();
      const response = await fetch('/api/clusters/close', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${idToken}` },
        body: JSON.stringify({ clusterId }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      alert('Cluster closed successfully!');
    } catch (error) {
      console.error("Error closing cluster:", error);
      alert((error as Error).message);
    } finally {
      setActionInProgressId(null);
    }
  };

  // --- PRE-RENDER LOGIC ---
  const loanMap = new Map<string, MicroloanCampaign>();
  loanCampaigns.forEach(loan => loanMap.set(loan.clusterId, loan));

  if (loading || !user) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  // --- RENDER ---
  return (
    <div className="min-h-screen bg-gray-50">
     

       <header className="flex items-center justify-between p-4 bg-white shadow-md">
        <div className="text-gray-600">
          Dashboard
        </div>
        <div className="flex items-center space-x-4">
          <ConnectKitButton />
          {isConnected && (
            <span className="text-sm text-gray-600">
              Connected: {address?.slice(0, 6)}...{address?.slice(-4)}
            </span>
          )}
        </div>
      </header>

      <main className="p-8">
        <div className="mb-12">
          <h2 className="text-3xl font-bold">My NFT Holdings (Off-Chain)</h2>
          <p className="text-sm text-gray-500 mt-1">This section shows NFTs from our old system for reference. The real NFTs are now on the Sepolia blockchain.</p>
          {myNfts.length === 0 ? (
            <p className="mt-4 text-gray-500">You do not own any off-chain cluster NFTs.</p>
          ) : (
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {myNfts.map(nft => (
                <NftCard key={nft.id} nft={nft} />
              ))}
            </div>
          )}
        </div>
        <hr className="my-8" />

        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Investment Clusters</h1>
          <button onClick={handleCreateCluster} disabled={isCreating} className="px-6 py-2 font-semibold text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:bg-indigo-300">
            {isCreating ? 'Creating...' : 'Create New Cluster'}
          </button>
        </div>

        <div className="mt-8">
          {clusters.length === 0 ? <p className="text-center text-gray-500">No clusters found. Create one to get started!</p> : (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {clusters.map((cluster) => {
                const loan = loanMap.get(cluster.id!);
                const handlers = {
                  onFund: handleFundCluster, onInvest: handleInvest,
                  onSettle: handleSettleCluster, onClose: handleCloseCluster,
                };
                return (
                  <ClusterCard
                    key={cluster.id} cluster={cluster} loan={loan}
                    actionInProgressId={actionInProgressId} handlers={handlers}
                  />
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}