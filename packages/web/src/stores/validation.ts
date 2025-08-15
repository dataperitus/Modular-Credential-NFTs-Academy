import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { Validation } from '@modular-nft-academy/shared';

interface ValidationState {
  // Validation state
  pendingValidations: Validation[];
  userValidations: Validation[];
  completedValidations: Validation[];
  
  // Loading states
  isLoadingValidations: boolean;
  isSubmittingValidation: boolean;
  isDisputingValidation: boolean;
  
  // Actions
  fetchPendingValidations: () => Promise<void>;
  fetchUserValidations: (validatorAddress: string) => Promise<void>;
  submitValidation: (validationId: number, score: number, feedback: string) => Promise<void>;
  disputeValidation: (validationId: number, reason: string) => Promise<void>;
  submitModuleForValidation: (moduleId: number) => Promise<void>;
}

export const useValidationStore = create<ValidationState>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        pendingValidations: [],
        userValidations: [],
        completedValidations: [],
        isLoadingValidations: false,
        isSubmittingValidation: false,
        isDisputingValidation: false,

        // Actions
        fetchPendingValidations: async () => {
          set({ isLoadingValidations: true });
          try {
            // Mock implementation - replace with actual Stacks contract calls
            const mockValidations: Validation[] = [
              {
                id: 1,
                moduleId: 101,
                validators: ['ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM'],
                scores: [85],
                feedbacks: ['Well-structured content with clear examples'],
                consensusReached: false,
                finalScore: 0,
                creationBlock: 149000,
                status: 'pending',
              },
              {
                id: 2,
                moduleId: 102,
                validators: [
                  'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
                  'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG',
                ],
                scores: [78, 82],
                feedbacks: [
                  'Good content but could use more practical examples',
                  'Solid theoretical foundation, examples are helpful'
                ],
                consensusReached: false,
                finalScore: 0,
                creationBlock: 148500,
                status: 'pending',
              },
              {
                id: 3,
                moduleId: 103,
                validators: [],
                scores: [],
                feedbacks: [],
                consensusReached: false,
                finalScore: 0,
                creationBlock: 149500,
                status: 'pending',
              },
            ];
            
            set({
              pendingValidations: mockValidations,
              isLoadingValidations: false,
            });
          } catch (error) {
            console.error('Error fetching pending validations:', error);
            set({ isLoadingValidations: false });
          }
        },

        fetchUserValidations: async (validatorAddress: string) => {
          try {
            // Mock implementation - replace with actual contract calls
            const mockUserValidations: Validation[] = [
              {
                id: 4,
                moduleId: 104,
                validators: [validatorAddress, 'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG'],
                scores: [88, 91],
                feedbacks: [
                  'Excellent content with comprehensive coverage',
                  'Well-researched and clearly presented'
                ],
                consensusReached: true,
                finalScore: 89,
                creationBlock: 145000,
                finalizationBlock: 147000,
                status: 'approved',
              },
              {
                id: 5,
                moduleId: 105,
                validators: [validatorAddress],
                scores: [75],
                feedbacks: ['Good introduction but needs more depth'],
                consensusReached: false,
                finalScore: 0,
                creationBlock: 148000,
                status: 'pending',
              },
            ];
            
            set({
              userValidations: mockUserValidations,
              completedValidations: mockUserValidations.filter(v => v.consensusReached),
            });
          } catch (error) {
            console.error('Error fetching user validations:', error);
          }
        },

        submitValidation: async (validationId: number, score: number, feedback: string) => {
          set({ isSubmittingValidation: true });
          try {
            // Mock implementation - replace with actual contract call
            await new Promise(resolve => setTimeout(resolve, 3000)); // Simulate transaction time
            
            const validatorAddress = 'current-validator-address'; // Replace with actual address
            const pendingValidations = get().pendingValidations;
            
            // Update the validation with new validator data
            const updatedValidations = pendingValidations.map(validation => {
              if (validation.id === validationId) {
                const newValidators = [...validation.validators, validatorAddress];
                const newScores = [...validation.scores, score];
                const newFeedbacks = [...validation.feedbacks, feedback];
                
                // Check if consensus is reached (need 3 validators)
                const consensusReached = newValidators.length >= 3;
                const finalScore = consensusReached 
                  ? Math.round(newScores.reduce((sum, s) => sum + s, 0) / newScores.length)
                  : 0;
                const status = consensusReached 
                  ? (finalScore >= 60 ? 'approved' : 'rejected') 
                  : 'pending';
                
                return {
                  ...validation,
                  validators: newValidators,
                  scores: newScores,
                  feedbacks: newFeedbacks,
                  consensusReached,
                  finalScore,
                  finalizationBlock: consensusReached ? 150000 : undefined, // Mock block
                  status: status as any,
                };
              }
              return validation;
            });
            
            // Add to user validations
            const userValidations = get().userValidations;
            const validationToAdd = updatedValidations.find(v => v.id === validationId);
            if (validationToAdd) {
              const updatedUserValidations = userValidations.some(v => v.id === validationId)
                ? userValidations.map(v => v.id === validationId ? validationToAdd : v)
                : [...userValidations, validationToAdd];
              
              set({
                userValidations: updatedUserValidations,
                completedValidations: updatedUserValidations.filter(v => v.consensusReached),
              });
            }
            
            set({
              pendingValidations: updatedValidations,
              isSubmittingValidation: false,
            });
          } catch (error) {
            console.error('Error submitting validation:', error);
            set({ isSubmittingValidation: false });
            throw error;
          }
        },

        disputeValidation: async (validationId: number, reason: string) => {
          set({ isDisputingValidation: true });
          try {
            // Mock implementation - replace with actual contract call
            await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate transaction time
            
            const completedValidations = get().completedValidations;
            
            // Update the validation status to disputed
            const updatedValidations = completedValidations.map(validation => 
              validation.id === validationId 
                ? { ...validation, status: 'disputed' as any }
                : validation
            );
            
            set({
              completedValidations: updatedValidations,
              isDisputingValidation: false,
            });
          } catch (error) {
            console.error('Error disputing validation:', error);
            set({ isDisputingValidation: false });
            throw error;
          }
        },

        submitModuleForValidation: async (moduleId: number) => {
          try {
            // Mock implementation - replace with actual contract call
            await new Promise(resolve => setTimeout(resolve, 3000)); // Simulate transaction time
            
            const newValidation: Validation = {
              id: Date.now(), // Mock ID
              moduleId,
              validators: [],
              scores: [],
              feedbacks: [],
              consensusReached: false,
              finalScore: 0,
              creationBlock: 150000, // Mock current block
              status: 'pending',
            };
            
            const pendingValidations = get().pendingValidations;
            set({
              pendingValidations: [...pendingValidations, newValidation],
            });
          } catch (error) {
            console.error('Error submitting module for validation:', error);
            throw error;
          }
        },
      }),
      {
        name: 'validation-store',
        partialize: (state) => ({
          userValidations: state.userValidations,
          completedValidations: state.completedValidations,
        }),
      }
    ),
    {
      name: 'validation-store',
    }
  )
);
