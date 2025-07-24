"use client";

import { Cluster, MicroloanCampaign } from '@/lib/types';
import { useAuth } from '@/context/AuthContext';

// Define the props for all the handler functions
interface ClusterCardHandlers {
    onFund: (clusterId: string) => void;
    onInvest: (clusterId: string) => void;
    onSettle: (e: React.FormEvent<HTMLFormElement>, clusterId: string) => void;
    onClose: (clusterId: string) => void;
}

interface ClusterCardProps {
    cluster: Cluster;
    loan: MicroloanCampaign | undefined;
    actionInProgressId: string | null;
    handlers: ClusterCardHandlers;
}

export default function ClusterCard({ cluster, loan, actionInProgressId, handlers }: ClusterCardProps) {
    const { claims } = useAuth();
    const isFull = cluster.slotsFilled >= cluster.slots;
    const isActionInProgress = actionInProgressId !== null;
    const isMyActionInProgress = actionInProgressId === cluster.id;

    const statusColors: { [key: string]: string } = {
        Pending: 'bg-yellow-100 text-yellow-800',
        Open: 'bg-green-100 text-green-800',
        Active: 'bg-purple-100 text-purple-800',
        Settling: 'bg-blue-100 text-blue-800',
        Closed: 'bg-gray-200 text-gray-800',
    };
    
    const statusText: { [key: string]: string } = {
        Pending: 'Awaiting Underwriter', Active: 'Trading in Progress',
        Settling: 'Payouts in Progress', Closed: 'Cluster Closed',
    };

    return (
        <div className="p-6 bg-white border rounded-lg shadow-lg flex flex-col">
            <div className="flex justify-between items-start">
                <h2 className="text-xl font-bold">Cluster #{cluster.id?.substring(0, 6)}</h2>
                <span className={`px-3 py-1 text-sm font-semibold rounded-full ${statusColors[cluster.status] || 'bg-gray-100'}`}>
                    {cluster.status}
                </span>
            </div>
            <p className="mt-4 text-gray-700">Investment Progress:</p>
            <p className="text-2xl font-bold">{cluster.slotsFilled} / {cluster.slots} slots</p>
            <div className="w-full mt-2 bg-gray-200 rounded-full h-2.5">
                <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${(cluster.slotsFilled / cluster.slots) * 100}%` }}></div>
            </div>

            {loan && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                    <p className="text-xs font-bold tracking-wider uppercase text-gray-500">IMPACT PROJECT</p>
                    <h4 className="font-semibold text-indigo-700">{loan.borrowerGroup}</h4>
                    <p className="text-sm text-gray-600">{loan.description}</p>
                </div>
            )}
            
            <div className="mt-6 flex-grow flex items-end">
                {cluster.status === 'Pending' && claims?.underwriter && (
                    <button onClick={() => handlers.onFund(cluster.id!)} disabled={isActionInProgress} className="w-full py-2 font-bold text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-gray-400">
                        {isMyActionInProgress ? 'Funding...' : 'Fund Cluster ($250)'}
                    </button>
                )}
                {cluster.status === 'Open' && (
                    <button onClick={() => handlers.onInvest(cluster.id!)} disabled={isFull || isActionInProgress} className="w-full py-2 font-bold text-white bg-green-600 rounded-md hover:bg-green-700 disabled:bg-gray-400">
                        {isMyActionInProgress ? 'Processing...' : isFull ? 'Cluster Full' : 'Invest $25'}
                    </button>
                )}
                {cluster.status === 'Active' && claims?.underwriter && (
                    <form onSubmit={(e) => handlers.onSettle(e, cluster.id!)} className="w-full flex items-center space-x-2">
                        <input type="number" name="profit" step="0.01" placeholder="e.g., 30.50" required className="w-full px-2 py-1.5 border rounded-md shadow-sm"/>
                        <button type="submit" disabled={isActionInProgress} className="px-4 py-2 font-bold text-white bg-purple-600 rounded-md hover:bg-purple-700 disabled:bg-gray-400">
                            {isMyActionInProgress ? '...' : 'Settle'}
                        </button>
                    </form>
                )}
                {cluster.status === 'Settling' && claims?.underwriter && (
                    <button onClick={() => handlers.onClose(cluster.id!)} disabled={isActionInProgress} className="w-full py-2 font-bold text-white bg-gray-700 rounded-md hover:bg-gray-800 disabled:bg-gray-400">
                        {isMyActionInProgress ? 'Closing...' : 'Confirm Payouts & Close'}
                    </button>
                )}
                {((!claims?.underwriter && (cluster.status === 'Pending' || cluster.status === 'Active' || cluster.status === 'Settling')) || ['Closed'].includes(cluster.status)) && (
                    <div className="w-full text-center py-2 text-gray-500 bg-gray-200 rounded-md">
                        {statusText[cluster.status] || `Status: ${cluster.status}`}
                    </div>
                )}
            </div>
        </div>
    );
}