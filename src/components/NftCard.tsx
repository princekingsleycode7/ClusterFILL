// src/components/NftCard.tsx

"use client";

import { ClusterNFT } from "@/lib/types";

interface NftCardProps {
  nft: ClusterNFT;
}

export default function NftCard({ nft }: NftCardProps) {
  const isUnderwriter = nft.type === 'underwriter';
  const cardColor = isUnderwriter ? 'bg-blue-50' : 'bg-green-50';
  const textColor = isUnderwriter ? 'text-blue-800' : 'text-green-800';
  const borderColor = isUnderwriter ? 'border-blue-200' : 'border-green-200';

  return (
    <div className={`p-4 border ${borderColor} rounded-lg shadow-md ${cardColor}`}>
      <div className="flex justify-between items-center">
        <h3 className={`text-lg font-bold ${textColor}`}>
          {isUnderwriter ? 'Underwriter Position' : 'Investor Share'}
        </h3>
        <span className="px-2 py-1 text-xs font-semibold text-gray-700 bg-gray-200 rounded-full">
          {nft.status.replace('_', ' ')}
        </span>
      </div>
      <p className="text-sm text-gray-600 mt-1">
        Cluster ID: <span className="font-mono">{nft.clusterId.substring(0, 10)}...</span>
      </p>
      <div className="mt-3">
        <p className="text-sm font-semibold text-gray-800">Entitlement:</p>
        <p className={`text-2xl font-bold ${textColor}`}>
          ${nft.entitlement.toFixed(2)}
        </p>
        <p className="text-xs text-gray-500">
            {isUnderwriter ? '(Principal + Interest)' : '(Your share of profit)'}
        </p>
      </div>
    </div>
  );
}