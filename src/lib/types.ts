// src/lib/types.ts

import { Timestamp } from 'firebase/firestore';

// Defines the possible states a cluster can be in
export type ClusterStatus = 'Pending' | 'Funded' | 'Open' | 'Active' | 'Settling' | 'Closed';

// The main Cluster data structure
export interface Cluster {
  id?: string; // The document ID
  status: ClusterStatus;
  totalValue: number; // Will be $250
  slots: number; // Will be 10
  slotsFilled: number;
  createdAt: Timestamp;
  // We will add underwriter and investor info later
}

// The structure for an individual investment within a cluster
export interface Investment {
  id?: string; // The document ID
  userId: string; // The Firebase Auth UID of the investor
  userEmail: string; // For easy display
  clusterId: string;
  amount: number; // Will be $25
  investedAt: Timestamp;
}

// src/lib/types.ts

// ... (keep the other types)

export interface Settlement {
  id?: string; // The cluster ID will be the settlement ID
  clusterId: string;
  totalProfit: number;
  underwriterInterestRate: number; // e.g., 0.02 for 2%
  underwriterPrincipal: number; // e.g., 250
  underwriterRepayment: number;
  platformFeeRate: number; // e.g., 0.20 for 20%
  platformFee: number;
  netProfitForInvestors: number;
  profitPerInvestorShare: number;
  settledAt: Timestamp;
}

// src/lib/types.ts

// ... (keep the other types)

// Defines the type of entitlement the NFT represents
export type NftType = 'underwriter' | 'investor';

// Defines the state of the NFT's claim
export type NftStatus = 'pending_settlement' | 'claimable' | 'claimed';

// The main NFT data structure
export interface ClusterNFT {
  id?: string; // The document ID
  ownerId: string; // The Firebase Auth UID of the owner
  clusterId: string;
  type: NftType;
  entitlement: number; // For Underwriter: principal + interest. For Investor: profit share.
  status: NftStatus;
  issuedAt: Timestamp;
  settledAt?: Timestamp; // Optional: added after settlement
}

// src/lib/types.ts

// ... (keep the other types)

export type LoanStatus = 'Funding' | 'Active' | 'Repaying' | 'Repaid' | 'Defaulted';

export interface MicroloanCampaign {
  id?: string; // Document ID
  clusterId: string; // The cluster funding this loan
  borrowerGroup: string; // e.g., "Tailor Cooperative"
  description: string;
  loanAmount: number; // e.g., 250
  durationMonths: number;
  repaymentPlan: string; // e.g., "8 weekly installments"
  riskRating: 'A+' | 'A' | 'B+' | 'B' | 'C';
  status: LoanStatus;
  repaidAmount: number;
  createdAt: Timestamp;
}