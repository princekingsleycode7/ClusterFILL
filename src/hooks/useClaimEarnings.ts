// src/hooks/useClaimEarnings.ts
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import ContractArtifact from '../../smart-contracts/artifacts/contracts/ClusterFiShare.sol/ClusterFiShare.json';

export const useClaimEarnings = () => {
  const { 
    data: hash, 
    error, 
    isPending, 
    writeContract 
  } = useWriteContract();

  const { isLoading: isConfirming, isSuccess: isConfirmed } = 
    useWaitForTransactionReceipt({ 
      hash,
    });

  const claim = (tokenId: number) => {
    writeContract({
      address: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as `0x${string}`,
      abi: ContractArtifact.abi, // <-- This is the ABI
      functionName: 'claimEarnings',
      args: [BigInt(tokenId)],
    });
  };

  return { 
    claim, 
    hash, 
    error, 
    isPending, 
    isConfirming, 
    isConfirmed 
  };
};