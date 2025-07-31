"use client";

import { useEffect } from "react";
import { ClusterNFT } from "@/lib/types";
import { useClaimEarnings } from "@/hooks/useClaimEarnings";
import { useAccount } from "wagmi";

interface NftCardProps {
  nft: ClusterNFT;
}

export default function NftCard({ nft }: NftCardProps) {
  // Use our custom hook to get the claim function and transaction state
  const { claim, hash, error, isPending, isConfirming, isConfirmed } = useClaimEarnings();
  
  // Get the currently connected wallet info
  const { address: connectedAddress, isConnected } = useAccount();
  
  // Effect to provide feedback to the user after a transaction attempt
  useEffect(() => {
    if (isConfirmed && hash) {
      alert(`Transaction successful! You can view it on Etherscan. Hash: ${hash}`);
    }
    if (error) {
      // This provides a more user-friendly error message
      const errorMessage = (error as any).shortMessage || 
                          (error as any).message || 
                          error.toString();
      alert(`Transaction failed: ${errorMessage}`);
    }
  }, [hash, error, isConfirmed]);

  // Determine NFT properties for styling and logic
  const isUnderwriter = nft.type === 'underwriter';
  const isClaimable = nft.status === 'claimable';
  
  // The owner of the NFT according to our off-chain database
  const isOwner = connectedAddress?.toLowerCase() === nft.ownerWalletAddress?.toLowerCase();

  // --- Dynamic Styling based on NFT type ---
  const cardColor = isUnderwriter ? 'bg-blue-50' : 'bg-green-50';
  const textColor = isUnderwriter ? 'text-blue-800' : 'text-green-800';
  const borderColor = isUnderwriter ? 'border-blue-200' : 'border-green-200';

  // Get status display
  const getStatusDisplay = () => {
    if (isConfirmed) return 'Claimed';
    if (isConfirming) return 'Confirming...';
    if (isPending) return 'Pending...';
    return nft.status.replace('_', ' ');
  };

  // Get status color
  const getStatusColor = () => {
    if (isConfirmed) return 'bg-green-200 text-green-800';
    if (isConfirming || isPending) return 'bg-yellow-200 text-yellow-800';
    
    switch (nft.status) {
      case 'active': return 'bg-blue-200 text-blue-800';
      case 'settled': return 'bg-purple-200 text-purple-800';
      case 'claimable': return 'bg-orange-200 text-orange-800';
      case 'claimed': return 'bg-green-200 text-green-800';
      default: return 'bg-gray-200 text-gray-700';
    }
  };

  const handleClaim = () => {
    // Check if wallet is connected
    if (!isConnected) {
      alert("Please connect your wallet first.");
      return;
    }

    // Check if user is the owner
    if (!isOwner) {
      alert("You can only claim earnings for NFTs you own.");
      return;
    }

    // We need to use the onChainTokenId that was saved during the minting process.
    if (nft.onChainTokenId === undefined || nft.onChainTokenId === null) {
      alert("Error: On-chain Token ID is missing for this NFT.");
      return;
    }

    claim(nft.onChainTokenId);
  };

  // Determine button state and text
  const getButtonState = () => {
    if (!isConnected) {
      return {
        disabled: true,
        text: 'Connect Wallet to Claim',
        className: 'w-full py-2 font-bold text-white bg-gray-400 rounded-md cursor-not-allowed'
      };
    }

    if (!isOwner) {
      return {
        disabled: true,
        text: 'Connect Correct Wallet',
        className: 'w-full py-2 font-bold text-orange-800 bg-orange-100 rounded-md cursor-not-allowed'
      };
    }

    if (isPending || isConfirming) {
      return {
        disabled: true,
        text: isPending ? 'Confirming...' : 'Processing...',
        className: 'w-full py-2 font-bold text-white bg-gray-400 rounded-md cursor-wait'
      };
    }

    return {
      disabled: false,
      text: 'Claim Earnings',
      className: 'w-full py-2 font-bold text-white bg-orange-500 rounded-md hover:bg-orange-600 transition-colors'
    };
  };

  return (
    <div className={`p-4 border ${borderColor} rounded-lg shadow-md ${cardColor} flex flex-col justify-between`}>
      <div>
        <div className="flex justify-between items-center">
          <h3 className={`text-lg font-bold ${textColor}`}>
            {isUnderwriter ? 'Underwriter Position' : 'Investor Share'}
          </h3>
          <span className={`px-2 py-1 text-xs font-semibold rounded-full capitalize ${getStatusColor()}`}>
            {getStatusDisplay()}
          </span>
        </div>
        
        <p className="text-sm text-gray-600 mt-1">
          Cluster ID: <span className="font-mono">{nft.clusterId.substring(0, 10)}...</span>
        </p>
        
        {/* Show token ID if available */}
        {nft.onChainTokenId !== undefined && (
          <p className="text-xs text-gray-500 mt-1">
            Token ID: <span className="font-mono">#{nft.onChainTokenId}</span>
          </p>
        )}
        
        <div className="mt-3">
          <p className="text-sm font-semibold text-gray-800">Entitlement:</p>
          <p className={`text-2xl font-bold ${textColor}`}>
            ${nft.entitlement.toFixed(2)}
          </p>
          <p className="text-xs text-gray-500">
            {isUnderwriter ? '(Principal + Interest)' : '(Your share of profit)'}
          </p>
        </div>

        {/* Show wallet address info */}
        {nft.ownerWalletAddress && (
          <div className="mt-2 text-xs text-gray-500">
            Owner: <span className="font-mono">
              {nft.ownerWalletAddress.substring(0, 6)}...{nft.ownerWalletAddress.substring(38)}
            </span>
          </div>
        )}
      </div>

      {/* --- Claim Button Logic --- */}
      <div className="mt-4">
        {isClaimable && !isConfirmed && (
          <button
            onClick={handleClaim}
            disabled={getButtonState().disabled}
            className={getButtonState().className}
          >
            {getButtonState().text}
          </button>
        )}
        
        {(nft.status === 'claimed' || isConfirmed) && (
          <div className="w-full py-2 text-center text-green-800 bg-green-200 rounded-md font-semibold">
            ✓ Earnings Claimed
          </div>
        )}

        {/* Show transaction hash if available */}
        {hash && (
          <div className="mt-2 text-xs text-gray-500">
            <p>Transaction: 
              <a 
                href={`https://sepolia.etherscan.io/tx/${hash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 underline ml-1"
              >
                View on Etherscan
              </a>
            </p>
          </div>
        )}

        {/* Connection status for non-claimable NFTs */}
        {!isClaimable && !isConnected && (
          <div className="w-full py-2 text-center text-gray-600 bg-gray-100 rounded-md text-sm">
            Connect wallet to view full details
          </div>
        )}
      </div>
    </div>
  );
}