import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { Stake, Validator, Reputation } from '@modular-nft-academy/shared';

interface StakingState {
  // Staking state
  userStakes: Stake[];
  totalStaked: string;
  availableRewards: string;
  
  // Validator state
  isValidator: boolean;
  validatorInfo: Validator | null;
  validators: Validator[];
  
  // Reputation state
  userReputation: Reputation | null;
  
  // Loading states
  isLoadingStakes: boolean;
  isLoadingValidators: boolean;
  isStaking: boolean;
  isUnstaking: boolean;
  isRegisteringValidator: boolean;
  
  // Actions
  fetchUserStakes: (userAddress: string) => Promise<void>;
  fetchValidators: () => Promise<void>;
  fetchUserReputation: (userAddress: string) => Promise<void>;
  stake: (amount: string, lockPeriod: number) => Promise<void>;
  unstake: (stakeId: number) => Promise<void>;
  claimRewards: (stakeId: number) => Promise<void>;
  registerValidator: (metadata: string) => Promise<void>;
  deregisterValidator: () => Promise<void>;
}

export const useStakingStore = create<StakingState>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        userStakes: [],
        totalStaked: '0',
        availableRewards: '0',
        isValidator: false,
        validatorInfo: null,
        validators: [],
        userReputation: null,
        isLoadingStakes: false,
        isLoadingValidators: false,
        isStaking: false,
        isUnstaking: false,
        isRegisteringValidator: false,

        // Actions
        fetchUserStakes: async (userAddress: string) => {
          set({ isLoadingStakes: true });
          try {
            // Mock implementation - replace with actual Stacks contract calls
            const mockStakes: Stake[] = [
              {
                id: 1,
                staker: userAddress,
                amount: '1000000000', // 1000 tokens
                lockPeriod: 52560, // 1 year in blocks
                startBlock: 100000,
                endBlock: 152560,
                claimedRewards: '50000000', // 50 tokens claimed
                active: true,
              },
              {
                id: 2,
                staker: userAddress,
                amount: '500000000', // 500 tokens
                lockPeriod: 26280, // 6 months in blocks
                startBlock: 120000,
                endBlock: 146280,
                claimedRewards: '0',
                active: true,
              },
            ];
            
            const totalStaked = mockStakes
              .filter(stake => stake.active)
              .reduce((sum, stake) => BigInt(sum) + BigInt(stake.amount), BigInt(0))
              .toString();
            
            // Calculate available rewards (mock)
            const availableRewards = '125000000'; // 125 tokens
            
            set({
              userStakes: mockStakes,
              totalStaked,
              availableRewards,
              isLoadingStakes: false,
            });
          } catch (error) {
            console.error('Error fetching user stakes:', error);
            set({ isLoadingStakes: false });
          }
        },

        fetchValidators: async () => {
          set({ isLoadingValidators: true });
          try {
            // Mock implementation - replace with actual contract calls
            const mockValidators: Validator[] = [
              {
                address: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
                stakeId: 1,
                metadata: 'Experienced validator with 5+ years in blockchain',
                registrationBlock: 95000,
                totalValidations: 150,
                successfulValidations: 143,
                active: true,
              },
              {
                address: 'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG',
                stakeId: 3,
                metadata: 'Academic researcher specializing in cryptography',
                registrationBlock: 98000,
                totalValidations: 89,
                successfulValidations: 86,
                active: true,
              },
              {
                address: 'ST2JHG361ZXG51QTQAADT5XPUBT8HCJ3F4FMZAXX',
                stakeId: 5,
                metadata: 'Community contributor and course creator',
                registrationBlock: 102000,
                totalValidations: 45,
                successfulValidations: 44,
                active: true,
              },
            ];
            
            set({
              validators: mockValidators,
              isLoadingValidators: false,
            });
          } catch (error) {
            console.error('Error fetching validators:', error);
            set({ isLoadingValidators: false });
          }
        },

        fetchUserReputation: async (userAddress: string) => {
          try {
            // Mock implementation - replace with actual contract calls
            const mockReputation: Reputation = {
              score: 750,
              validationsCount: 45,
              successfulValidations: 44,
              accuracyRate: 97.8,
              lastUpdate: Date.now() - 24 * 60 * 60 * 1000, // 1 day ago
              rank: 'Advanced',
            };
            
            // Check if user is a validator
            const validators = get().validators;
            const isValidator = validators.some(v => v.address === userAddress && v.active);
            const validatorInfo = validators.find(v => v.address === userAddress && v.active) || null;
            
            set({
              userReputation: mockReputation,
              isValidator,
              validatorInfo,
            });
          } catch (error) {
            console.error('Error fetching user reputation:', error);
          }
        },

        stake: async (amount: string, lockPeriod: number) => {
          set({ isStaking: true });
          try {
            // Mock implementation - replace with actual contract call
            await new Promise(resolve => setTimeout(resolve, 3000)); // Simulate transaction time
            
            const currentBlock = 150000; // Mock current block
            const newStake: Stake = {
              id: get().userStakes.length + 1,
              staker: 'current-user-address', // Replace with actual user address
              amount,
              lockPeriod,
              startBlock: currentBlock,
              endBlock: currentBlock + lockPeriod,
              claimedRewards: '0',
              active: true,
            };
            
            const currentStakes = get().userStakes;
            const newTotalStaked = (BigInt(get().totalStaked) + BigInt(amount)).toString();
            
            set({
              userStakes: [...currentStakes, newStake],
              totalStaked: newTotalStaked,
              isStaking: false,
            });
          } catch (error) {
            console.error('Error staking tokens:', error);
            set({ isStaking: false });
            throw error;
          }
        },

        unstake: async (stakeId: number) => {
          set({ isUnstaking: true });
          try {
            // Mock implementation - replace with actual contract call
            await new Promise(resolve => setTimeout(resolve, 3000)); // Simulate transaction time
            
            const currentStakes = get().userStakes;
            const stakeToUnstake = currentStakes.find(s => s.id === stakeId);
            
            if (!stakeToUnstake) {
              throw new Error('Stake not found');
            }
            
            // Update stakes - mark as inactive
            const updatedStakes = currentStakes.map(stake => 
              stake.id === stakeId ? { ...stake, active: false } : stake
            );
            
            const newTotalStaked = (BigInt(get().totalStaked) - BigInt(stakeToUnstake.amount)).toString();
            
            set({
              userStakes: updatedStakes,
              totalStaked: newTotalStaked,
              isUnstaking: false,
            });
          } catch (error) {
            console.error('Error unstaking tokens:', error);
            set({ isUnstaking: false });
            throw error;
          }
        },

        claimRewards: async (stakeId: number) => {
          try {
            // Mock implementation - replace with actual contract call
            await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate transaction time
            
            const currentStakes = get().userStakes;
            const mockRewardAmount = '25000000'; // 25 tokens
            
            // Update stakes - add claimed rewards
            const updatedStakes = currentStakes.map(stake => 
              stake.id === stakeId 
                ? { 
                    ...stake, 
                    claimedRewards: (BigInt(stake.claimedRewards) + BigInt(mockRewardAmount)).toString() 
                  } 
                : stake
            );
            
            // Update available rewards
            const newAvailableRewards = (BigInt(get().availableRewards) - BigInt(mockRewardAmount)).toString();
            
            set({
              userStakes: updatedStakes,
              availableRewards: newAvailableRewards,
            });
          } catch (error) {
            console.error('Error claiming rewards:', error);
            throw error;
          }
        },

        registerValidator: async (metadata: string) => {
          set({ isRegisteringValidator: true });
          try {
            // Mock implementation - replace with actual contract call
            await new Promise(resolve => setTimeout(resolve, 3000)); // Simulate transaction time
            
            const newValidator: Validator = {
              address: 'current-user-address', // Replace with actual user address
              stakeId: 1, // Use the first stake ID for simplicity
              metadata,
              registrationBlock: 150000, // Mock current block
              totalValidations: 0,
              successfulValidations: 0,
              active: true,
            };
            
            const currentValidators = get().validators;
            
            set({
              validators: [...currentValidators, newValidator],
              isValidator: true,
              validatorInfo: newValidator,
              isRegisteringValidator: false,
            });
          } catch (error) {
            console.error('Error registering as validator:', error);
            set({ isRegisteringValidator: false });
            throw error;
          }
        },

        deregisterValidator: async () => {
          try {
            // Mock implementation - replace with actual contract call
            await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate transaction time
            
            const currentValidators = get().validators;
            const userAddress = 'current-user-address'; // Replace with actual user address
            
            // Update validators - mark as inactive
            const updatedValidators = currentValidators.map(validator => 
              validator.address === userAddress 
                ? { ...validator, active: false } 
                : validator
            );
            
            set({
              validators: updatedValidators,
              isValidator: false,
              validatorInfo: null,
            });
          } catch (error) {
            console.error('Error deregistering validator:', error);
            throw error;
          }
        },
      }),
      {
        name: 'staking-store',
        partialize: (state) => ({
          userStakes: state.userStakes,
          validators: state.validators,
          userReputation: state.userReputation,
        }),
      }
    ),
    {
      name: 'staking-store',
    }
  )
);
