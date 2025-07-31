// src/lib/ethers-service.ts

import { ethers } from 'ethers';

// We need the ABI of our contract. ABI (Application Binary Interface) is the
// standard way to interact with contracts. It's a JSON file that describes the contract's functions.
// We will get this from the artifacts folder in our smart-contracts project.
import ContractArtifact from '../../smart-contracts/artifacts/contracts/ClusterFiShare.sol/ClusterFiShare.json';

// --- SETUP PROVIDER AND WALLET ---
// The provider is our read-only connection to the blockchain.
const provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL!);

// The signer is our wallet that can sign and send transactions (and pay for gas).
const signer = new ethers.Wallet(process.env.CONTRACT_OWNER_PRIVATE_KEY!, provider);

// --- SETUP CONTRACT INSTANCE ---
// Get the ABI and address
const contractABI = ContractArtifact.abi;
const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS!;

// Create a contract instance. This is our main tool for interacting with the contract.
// We connect it to the 'signer' so it can send transactions on our behalf.
export const clusterFiShareContract = new ethers.Contract(
  contractAddress,
  contractABI,
  signer
);

console.log(`Ethers service initialized. Contract address: ${contractAddress}`);