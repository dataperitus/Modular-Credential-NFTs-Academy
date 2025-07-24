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
  stakeAmount: number;
  rewardEarned: number;
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

// Staking-related types
export interface StakeInfo {
  amount: number;
  stakeDate: number;
  isActive: boolean;
}

export interface StakeEvent {
  staker: string;
  amount: number;
  blockHeight: number;
  txId: string;
}

export interface RewardCalculation {
  baseReward: number;
  bonusReward: number;
  totalReward: number;
  extraModules: number;
}

export interface EligibilityStatus {
  modulesSufficient: boolean;
  hasActiveStake: boolean;
  modulesOwned: number;
  alreadyHasDegree: boolean;
  requiredModules: number;
}

// Enhanced contract configuration
export interface EnhancedContractConfig extends ContractConfig {
  minStakeAmount: number;
  baseRewardAmount: number;
  bonusRewardPerModule: number;
  requiredModules: number;
}
