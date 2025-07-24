'use client';

import React, { useState, useEffect } from 'react';
import { useConnect } from '@stacks/connect-react';
import { StacksTestnet } from '@stacks/network';
import { 
  AnchorMode,
  PostConditionMode,
  standardPrincipalCV,
  uintCV,
  contractPrincipalCV,
  createAssetInfo,
  makeStandardSTXPostCondition,
  FungibleConditionCode
} from '@stacks/transactions';
import { UserTranscript, WalletState } from '@modular-nft-academy/shared';

interface StakingInterfaceProps {
  userAddress?: string;
  onStakeSuccess?: (txId: string) => void;
  onStakeError?: (error: string) => void;
}

interface StakeInfo {
  amount: number;
  stakeDate: number;
  isActive: boolean;
}

export const StakingInterface: React.FC<StakingInterfaceProps> = ({
  userAddress,
  onStakeSuccess,
  onStakeError
}) => {
  const { doContractCall } = useConnect();
  const [stakeAmount, setStakeAmount] = useState<string>('1');
  const [isStaking, setIsStaking] = useState(false);
  const [currentStake, setCurrentStake] = useState<StakeInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const MIN_STAKE_STX = 1; // 1 STX minimum
  const network = new StacksTestnet();

  useEffect(() => {
    if (userAddress) {
      fetchCurrentStake();
    }
  }, [userAddress]);

  const fetchCurrentStake = async () => {
    if (!userAddress) return;
    
    setIsLoading(true);
    try {
      // In a real implementation, this would call the read-only function
      // For now, we'll simulate the API call
      const response = await fetch(`/api/stakes/${userAddress}`);
      if (response.ok) {
        const stakeData = await response.json();
        setCurrentStake(stakeData);
      }
    } catch (error) {
      console.error('Error fetching stake:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStake = async () => {
    if (!userAddress || !stakeAmount) return;

    const stakeAmountMicroSTX = Math.floor(parseFloat(stakeAmount) * 1000000);
    
    if (stakeAmountMicroSTX < MIN_STAKE_STX * 1000000) {
      onStakeError?.(`Minimum stake amount is ${MIN_STAKE_STX} STX`);
      return;
    }

    setIsStaking(true);

    try {
      const postConditions = [
        makeStandardSTXPostCondition(
          userAddress,
          FungibleConditionCode.Equal,
          stakeAmountMicroSTX
        )
      ];

      await doContractCall({
        network,
        anchorMode: AnchorMode.Any,
        contractAddress: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || '',
        contractName: 'degree-sbt',
        functionName: 'stake-for-degree',
        functionArgs: [uintCV(stakeAmountMicroSTX)],
        postConditions,
        postConditionMode: PostConditionMode.Deny,
        onFinish: (data) => {
          console.log('Staking transaction submitted:', data.txId);
          onStakeSuccess?.(data.txId);
          fetchCurrentStake(); // Refresh stake info
        },
        onCancel: () => {
          console.log('Staking cancelled');
          setIsStaking(false);
        },
      });
    } catch (error) {
      console.error('Staking error:', error);
      onStakeError?.(error instanceof Error ? error.message : 'Staking failed');
    } finally {
      setIsStaking(false);
    }
  };

  const formatSTX = (microSTX: number): string => {
    return (microSTX / 1000000).toFixed(6);
  };

  if (!userAddress) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <p className="text-yellow-800">Please connect your wallet to stake for degree completion.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-8 bg-gray-200 rounded w-full mb-4"></div>
          <div className="h-10 bg-gray-200 rounded w-1/3"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Degree Commitment Staking
      </h3>
      
      {currentStake ? (
        <div className="mb-6">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h4 className="font-medium text-green-800 mb-2">Current Stake</h4>
            <div className="space-y-1 text-sm text-green-700">
              <p>Amount: {formatSTX(currentStake.amount)} STX</p>
              <p>Status: {currentStake.isActive ? 'Active' : 'Completed'}</p>
              <p>Staked at block: {currentStake.stakeDate}</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="mb-6">
          <p className="text-gray-600 mb-4">
            Stake STX tokens to show your commitment to completing the degree program. 
            Your stake will be returned along with bonus rewards when you earn your degree.
          </p>
          
          <div className="space-y-4">
            <div>
              <label htmlFor="stakeAmount" className="block text-sm font-medium text-gray-700 mb-2">
                Stake Amount (STX)
              </label>
              <input
                type="number"
                id="stakeAmount"
                min={MIN_STAKE_STX}
                step="0.1"
                value={stakeAmount}
                onChange={(e) => setStakeAmount(e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder={`Minimum ${MIN_STAKE_STX} STX`}
                disabled={isStaking}
              />
              <p className="mt-1 text-xs text-gray-500">
                Minimum stake: {MIN_STAKE_STX} STX
              </p>
            </div>

            <button
              onClick={handleStake}
              disabled={isStaking || !stakeAmount || parseFloat(stakeAmount) < MIN_STAKE_STX}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isStaking ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Staking...
                </span>
              ) : (
                'Stake STX'
              )}
            </button>
          </div>
        </div>
      )}

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-medium text-blue-800 mb-2">Staking Benefits</h4>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• Demonstrates commitment to completing the program</li>
          <li>• Required to mint your degree NFT</li>
          <li>• Earn bonus rewards for completing extra modules</li>
          <li>• Base reward: 0.5 STX + 0.1 STX per extra module</li>
        </ul>
      </div>
    </div>
  );
};
