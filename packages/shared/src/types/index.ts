// Shared TypeScript types for Modular Credential NFTs Academy

export interface ModuleNFT {
  tokenId: number;
  moduleId: string;
  moduleName: string;
  completionDate: number;
  owner: string;
  metadataUri?: string;
}

export interface DegreeSBT {
  tokenId: number;
  recipient: string;
  completionDate: number;
  modulesCompleted: number;
  degreeType: string;
}

// Governance and Staking Types
export interface GovernanceToken {
  balance: string;
  delegatedTo?: string;
  votingPower: string;
}

export interface Stake {
  id: number;
  staker: string;
  amount: string;
  lockPeriod: number;
  startBlock: number;
  endBlock: number;
  claimedRewards: string;
  active: boolean;
}

export interface Validator {
  address: string;
  stakeId: number;
  metadata: string;
  registrationBlock: number;
  totalValidations: number;
  successfulValidations: number;
  active: boolean;
}

export interface Validation {
  id: number;
  moduleId: number;
  validators: string[];
  scores: number[];
  feedbacks: string[];
  consensusReached: boolean;
  finalScore: number;
  creationBlock: number;
  finalizationBlock?: number;
  status: 'pending' | 'approved' | 'rejected' | 'disputed';
}

export interface Reputation {
  score: number;
  validationsCount: number;
  successfulValidations: number;
  accuracyRate: number;
  lastUpdate: number;
  rank: string;
}

export interface Proposal {
  id: number;
  proposer: string;
  title: string;
  description: string;
  proposalType: 'parameter' | 'upgrade' | 'funding' | 'general';
  votingStart: number;
  votingEnd: number;
  executionDelayEnd: number;
  votesFor: string;
  votesAgainst: string;
  quorum: string;
  executed: boolean;
  cancelled: boolean;
  metadataUri?: string;
  status: 'pending' | 'active' | 'succeeded' | 'defeated' | 'executed' | 'cancelled';
}

export interface Vote {
  proposalId: number;
  voter: string;
  support: boolean;
  votingPower: string;
  timestamp: number;
}

export interface ModuleMetadata {
  name: string;
  description: string;
  image: string;
  attributes: Array<{
    trait_type: string;
    value: string | number;
  }>;
  moduleId: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  estimatedTime: string;
}

export interface UserTranscript {
  userAddress: string;
  moduleNFTs: ModuleNFT[];
  degreeNFT?: DegreeSBT;
  totalModulesCompleted: number;
  isEligibleForDegree: boolean;
}

export interface ContractConfig {
  moduleNFTContract: string;
  degreeSBTContract: string;
  networkUrl: string;
  networkType: 'mainnet' | 'testnet' | 'devnet';
}

export interface WalletState {
  isConnected: boolean;
  userAddress?: string;
  network?: string;
}

// Contract function response types
export interface ContractCallResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  txId?: string;
}

// Event types for blockchain events
export interface NFTMintEvent {
  tokenId: number;
  recipient: string;
  moduleId: string;
  blockHeight: number;
  txId: string;
}

export interface NFTTransferEvent {
  tokenId: number;
  from: string;
  to: string;
  blockHeight: number;
  txId: string;
}
