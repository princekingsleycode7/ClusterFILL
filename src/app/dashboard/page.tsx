"use client";

// --- ALL IMPORTS AT THE TOP ---
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { auth, db } from '@/lib/firebase';
import { signOut } from 'firebase/auth';
// Correctly import 'where'
import { collection, query, onSnapshot, where } from 'firebase/firestore'; 
import { Cluster, MicroloanCampaign, ClusterNFT } from '@/lib/types';
import NftCard from '@/components/NftCard';
import ClusterCard from '@/components/ClusterCard';

export default function DashboardPage() {
  // --- STATE MANAGEMENT ---
  const { user, claims, loading } = useAuth();
  const router = useRouter();
  const [clusters, setClusters] = useState<Cluster[]>([]);
  const [myNfts, setMyNfts] = useState<ClusterNFT[]>([]); // Using correct type
  const [loanCampaigns, setLoanCampaigns] = useState<MicroloanCampaign[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [actionInProgressId, setActionInProgressId] = useState<string | null>(null);

  // --- DATA FETCHING HOOKS ---
  useEffect(() => {
    if (!loading && !user) router.push('/login');
  }, [user, loading, router]);

  useEffect(() => {
    if (!user) return;
    
    // Fetch Clusters
    const qClusters = query(collection(db, 'clusters'));
    const unsubClusters = onSnapshot(qClusters, (snap) => {
      setClusters(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Cluster)));
    });

    // --- THIS IS THE CORRECTED QUERY ---
    const qNfts = query(collection(db, 'nfts'), where('ownerId', '==', user.uid));
    const unsubNfts = onSnapshot(qNfts, (snap) => {
      setMyNfts(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as ClusterNFT)));
    });
    
    // Fetch Loans
    const qLoans = query(collection(db, 'microloanCampaigns'));
    const unsubLoans = onSnapshot(qLoans, (snap) => {
      setLoanCampaigns(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as MicroloanCampaign)));
    });

    return () => { // Cleanup all listeners
      unsubClusters();
      unsubNfts();
      unsubLoans();
    };
  }, [user]);

  // --- API HANDLER FUNCTIONS ---
  // (Your handler functions should be here, they are correct from the last version)
  const handleSignOut = async () => {/*...*/};
  const handleCreateCluster = async () => {/*...*/};
  const handleFundCluster = async (clusterId: string) => {/*...*/};
  const handleInvest = async (clusterId: string) => {/*...*/};
  const handleSettleCluster = async (e: React.FormEvent<HTMLFormElement>, clusterId: string) => {/*...*/};
  const handleCloseCluster = async (clusterId: string) => {/*...*/};

  // --- PRE-RENDER LOGIC ---
  const loanMap = new Map<string, MicroloanCampaign>();
  loanCampaigns.forEach(loan => loanMap.set(loan.clusterId, loan));

  if (loading || !user) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  // --- RENDER ---
  return (
    <div className="min-h-screen bg-gray-50">
      {/* ... (Header remains the same) ... */}
      <header className="flex items-center justify-between p-4 bg-white shadow-md">
        <div className="text-gray-600">
          Logged in as: <span className="font-semibold text-indigo-600">{user.email}</span>
        </div>
        <button onClick={handleSignOut} className="px-4 py-2 font-medium text-white bg-red-600 rounded-md hover:bg-red-700">
          Sign Out
        </button>
      </header>

      <main className="p-8">
        {/* NFT Holdings Section */}
        <div className="mb-12">
            <h2 className="text-3xl font-bold">My NFT Holdings</h2>
            {myNfts.length === 0 ? (
                <p className="mt-4 text-gray-500">You do not own any cluster NFTs yet.</p>
            ) : (
                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {myNfts.map(nft => (
                        <NftCard key={nft.id} nft={nft} />
                    ))}
                </div>
            )}
        </div>
        <hr className="my-8" />
        
        {/* ... (Rest of the cluster display logic remains the same) ... */}
         <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Investment Clusters</h1>
          <button onClick={handleCreateCluster} disabled={isCreating} className="px-6 py-2 font-semibold text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:bg-indigo-300">
            {isCreating ? 'Creating...' : 'Create New Cluster'}
          </button>
        </div>
        <div className="mt-8">
          {clusters.length === 0 ? <p className="text-center text-gray-500">No clusters found.</p> : (
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