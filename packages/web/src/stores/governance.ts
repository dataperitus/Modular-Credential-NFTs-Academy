import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { GovernanceToken, Proposal, Vote, Validator, Stake, Reputation } from '@modular-nft-academy/shared';

interface GovernanceState {
  // Token state
  tokenBalance: string;
  votingPower: string;
  delegatedTo: string | null;
  
  // Proposals state
  proposals: Proposal[];
  userVotes: Vote[];
  
  // Loading states
  isLoadingProposals: boolean;
  isLoadingTokenData: boolean;
  isVoting: boolean;
  
  // Actions
  fetchTokenData: (userAddress: string) => Promise<void>;
  fetchProposals: () => Promise<void>;
  submitVote: (proposalId: number, support: boolean, votingPower: string) => Promise<void>;
  createProposal: (title: string, description: string, proposalType: string, metadataUri?: string) => Promise<void>;
  delegateVote: (to: string) => Promise<void>;
  undelegateVote: () => Promise<void>;
}

export const useGovernanceStore = create<GovernanceState>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        tokenBalance: '0',
        votingPower: '0',
        delegatedTo: null,
        proposals: [],
        userVotes: [],
        isLoadingProposals: false,
        isLoadingTokenData: false,
        isVoting: false,

        // Actions
        fetchTokenData: async (userAddress: string) => {
          set({ isLoadingTokenData: true });
          try {
            // Mock implementation - replace with actual Stacks contract calls
            const mockTokenData = {
              balance: '1000000000', // 1000 tokens
              votingPower: '1250000000', // 1250 tokens (including delegated)
              delegatedTo: null,
            };
            
            set({
              tokenBalance: mockTokenData.balance,
              votingPower: mockTokenData.votingPower,
              delegatedTo: mockTokenData.delegatedTo,
              isLoadingTokenData: false,
            });
          } catch (error) {
            console.error('Error fetching token data:', error);
            set({ isLoadingTokenData: false });
          }
        },

        fetchProposals: async () => {
          set({ isLoadingProposals: true });
          try {
            // Mock implementation - replace with actual contract calls
            const mockProposals: Proposal[] = [
              {
                id: 1,
                proposer: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
                title: 'Increase Validator Minimum Stake',
                description: 'Proposal to increase the minimum stake required for validators from 1000 to 2000 tokens to improve network security.',
                proposalType: 'parameter',
                votingStart: Date.now() - 24 * 60 * 60 * 1000, // 1 day ago
                votingEnd: Date.now() + 6 * 24 * 60 * 60 * 1000, // 6 days from now
                executionDelayEnd: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days from now
                votesFor: '5000000000', // 5000 tokens
                votesAgainst: '2000000000', // 2000 tokens
                quorum: '7000000000', // 7000 tokens
                executed: false,
                cancelled: false,
                status: 'active',
              },
              {
                id: 2,
                proposer: 'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG',
                title: 'Add New Course Category: AI & Machine Learning',
                description: 'Proposal to add a new course category focused on Artificial Intelligence and Machine Learning topics.',
                proposalType: 'general',
                votingStart: Date.now() - 2 * 24 * 60 * 60 * 1000, // 2 days ago
                votingEnd: Date.now() + 5 * 24 * 60 * 60 * 1000, // 5 days from now
                executionDelayEnd: Date.now() + 6 * 24 * 60 * 60 * 1000, // 6 days from now
                votesFor: '3500000000', // 3500 tokens
                votesAgainst: '1500000000', // 1500 tokens
                quorum: '5000000000', // 5000 tokens
                executed: false,
                cancelled: false,
                status: 'active',
              },
            ];
            
            set({
              proposals: mockProposals,
              isLoadingProposals: false,
            });
          } catch (error) {
            console.error('Error fetching proposals:', error);
            set({ isLoadingProposals: false });
          }
        },

        submitVote: async (proposalId: number, support: boolean, votingPower: string) => {
          set({ isVoting: true });
          try {
            // Mock implementation - replace with actual contract call
            await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate transaction time
            
            const newVote: Vote = {
              proposalId,
              voter: 'current-user-address', // Replace with actual user address
              support,
              votingPower,
              timestamp: Date.now(),
            };
            
            // Update user votes
            const currentUserVotes = get().userVotes;
            set({ userVotes: [...currentUserVotes, newVote] });
            
            // Update proposal vote counts
            const proposals = get().proposals.map(proposal => {
              if (proposal.id === proposalId) {
                const votingPowerBigInt = BigInt(votingPower);
                const currentVotesFor = BigInt(proposal.votesFor);
                const currentVotesAgainst = BigInt(proposal.votesAgainst);
                
                return {
                  ...proposal,
                  votesFor: support 
                    ? (currentVotesFor + votingPowerBigInt).toString()
                    : proposal.votesFor,
                  votesAgainst: !support
                    ? (currentVotesAgainst + votingPowerBigInt).toString()
                    : proposal.votesAgainst,
                  quorum: (BigInt(proposal.quorum) + votingPowerBigInt).toString(),
                };
              }
              return proposal;
            });
            
            set({ proposals, isVoting: false });
          } catch (error) {
            console.error('Error submitting vote:', error);
            set({ isVoting: false });
          }
        },

        createProposal: async (title: string, description: string, proposalType: string, metadataUri?: string) => {
          try {
            // Mock implementation - replace with actual contract call
            await new Promise(resolve => setTimeout(resolve, 3000)); // Simulate transaction time
            
            const newProposal: Proposal = {
              id: get().proposals.length + 1,
              proposer: 'current-user-address', // Replace with actual user address
              title,
              description,
              proposalType: proposalType as any,
              votingStart: Date.now() + 24 * 60 * 60 * 1000, // Start voting in 24 hours
              votingEnd: Date.now() + 8 * 24 * 60 * 60 * 1000, // End voting in 8 days
              executionDelayEnd: Date.now() + 9 * 24 * 60 * 60 * 1000, // Execute after 9 days
              votesFor: '0',
              votesAgainst: '0',
              quorum: '0',
              executed: false,
              cancelled: false,
              metadataUri,
              status: 'pending',
            };
            
            const currentProposals = get().proposals;
            set({ proposals: [...currentProposals, newProposal] });
          } catch (error) {
            console.error('Error creating proposal:', error);
            throw error;
          }
        },

        delegateVote: async (to: string) => {
          try {
            // Mock implementation - replace with actual contract call
            await new Promise(resolve => setTimeout(resolve, 2000));
            set({ delegatedTo: to });
          } catch (error) {
            console.error('Error delegating vote:', error);
            throw error;
          }
        },

        undelegateVote: async () => {
          try {
            // Mock implementation - replace with actual contract call
            await new Promise(resolve => setTimeout(resolve, 2000));
            set({ delegatedTo: null });
          } catch (error) {
            console.error('Error undelegating vote:', error);
            throw error;
          }
        },
      }),
      {
        name: 'governance-store',
        partialize: (state) => ({
          proposals: state.proposals,
          userVotes: state.userVotes,
        }),
      }
    ),
    {
      name: 'governance-store',
    }
  )
);
