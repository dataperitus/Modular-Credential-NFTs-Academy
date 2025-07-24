'use client';

import React, { useState, useEffect } from 'react';
import { useConnect } from '@stacks/connect-react';
import { StacksTestnet } from '@stacks/network';
import { 
  AnchorMode,
  PostConditionMode,
  standardPrincipalCV,
  uintCV
} from '@stacks/transactions';
import { ModuleNFT, DegreeSBT } from '@modular-nft-academy/shared';

interface DegreeMintingProps {
  userAddress?: string;
  onMintSuccess?: (txId: string) => void;
  onMintError?: (error: string) => void;
}

interface EligibilityStatus {
  modulesSufficient: boolean;
  hasActiveStake: boolean;
  modulesOwned: number;
  alreadyHasDegree: boolean;
}

interface RewardInfo {
  baseReward: number;
  bonusReward: number;
  totalReward: number;
}

export const DegreeMinting: React.FC<DegreeMintingProps> = ({
  userAddress,
  onMintSuccess,
  onMintError
}) => {
  const { doContractCall } = useConnect();
  const [eligibility, setEligibility] = useState<EligibilityStatus | null>(null);
  const [rewardInfo, setRewardInfo] = useState<RewardInfo | null>(null);
  const [userModules, setUserModules] = useState<ModuleNFT[]>([]);
  const [isMinting, setIsMinting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [degree, setDegree] = useState<DegreeSBT | null>(null);

  const network = new StacksTestnet();
  const REQUIRED_MODULES = 3;

  useEffect(() => {
    if (userAddress) {
      fetchEligibilityAndModules();
    }
  }, [userAddress]);

  const fetchEligibilityAndModules = async () => {
    if (!userAddress) return;
    
    setIsLoading(true);
    try {
      // Fetch eligibility status
      const eligibilityResponse = await fetch(`/api/eligibility/${userAddress}`);
      if (eligibilityResponse.ok) {
        const eligibilityData = await eligibilityResponse.json();
        setEligibility(eligibilityData);
      }

      // Fetch user's modules
      const modulesResponse = await fetch(`/api/modules/${userAddress}`);
      if (modulesResponse.ok) {
        const modulesData = await modulesResponse.json();
        setUserModules(modulesData);
      }

      // Fetch reward calculation
      const rewardResponse = await fetch(`/api/rewards/${userAddress}`);
      if (rewardResponse.ok) {
        const rewardData = await rewardResponse.json();
        setRewardInfo(rewardData);
      }

      // Check if user already has a degree
      const degreeResponse = await fetch(`/api/degree/${userAddress}`);
      if (degreeResponse.ok) {
        const degreeData = await degreeResponse.json();
        setDegree(degreeData);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMintDegree = async () => {
    if (!userAddress || !eligibility?.modulesSufficient || !eligibility?.hasActiveStake) return;

    setIsMinting(true);

    try {
      await doContractCall({
        network,
        anchorMode: AnchorMode.Any,
        contractAddress: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || '',
        contractName: 'degree-sbt',
        functionName: 'mint-degree',
        functionArgs: [standardPrincipalCV(userAddress)],
        postConditionMode: PostConditionMode.Allow,
        onFinish: (data) => {
          console.log('Degree minting transaction submitted:', data.txId);
          onMintSuccess?.(data.txId);
          fetchEligibilityAndModules(); // Refresh data
        },
        onCancel: () => {
          console.log('Degree minting cancelled');
          setIsMinting(false);
        },
      });
    } catch (error) {
      console.error('Degree minting error:', error);
      onMintError?.(error instanceof Error ? error.message : 'Degree minting failed');
    } finally {
      setIsMinting(false);
    }
  };

  const formatSTX = (microSTX: number): string => {
    return (microSTX / 1000000).toFixed(6);
  };

  const getStatusIcon = (condition: boolean) => {
    return condition ? (
      <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
      </svg>
    ) : (
      <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
      </svg>
    );
  };

  if (!userAddress) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <p className="text-yellow-800">Please connect your wallet to check degree eligibility.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded w-full"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }

  if (degree) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
            <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Congratulations!</h3>
          <p className="text-gray-600 mb-4">You have successfully earned your degree NFT.</p>
          
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-left">
            <h4 className="font-medium text-green-800 mb-2">Degree Details</h4>
            <div className="space-y-1 text-sm text-green-700">
              <p>Token ID: #{degree.tokenId}</p>
              <p>Degree Type: {degree.degreeType}</p>
              <p>Modules Completed: {degree.modulesCompleted}</p>
              <p>Completion Date: Block {degree.completionDate}</p>
              <p>Reward Earned: {formatSTX(degree.modulesCompleted * 100000)} STX</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Degree Eligibility Status
      </h3>

      {eligibility && (
        <div className="space-y-4 mb-6">
          <div className="flex items-center space-x-3">
            {getStatusIcon(eligibility.modulesSufficient)}
            <span className={`text-sm ${eligibility.modulesSufficient ? 'text-green-700' : 'text-red-700'}`}>
              Modules Completed: {eligibility.modulesOwned}/{REQUIRED_MODULES}
              {eligibility.modulesSufficient ? ' ✓' : ' (Insufficient)'}
            </span>
          </div>

          <div className="flex items-center space-x-3">
            {getStatusIcon(eligibility.hasActiveStake)}
            <span className={`text-sm ${eligibility.hasActiveStake ? 'text-green-700' : 'text-red-700'}`}>
              Active Stake: {eligibility.hasActiveStake ? 'Yes ✓' : 'No (Required)'}
            </span>
          </div>

          <div className="flex items-center space-x-3">
            {getStatusIcon(!eligibility.alreadyHasDegree)}
            <span className={`text-sm ${!eligibility.alreadyHasDegree ? 'text-green-700' : 'text-red-700'}`}>
              Degree Status: {eligibility.alreadyHasDegree ? 'Already Earned' : 'Available ✓'}
            </span>
          </div>
        </div>
      )}

      {userModules.length > 0 && (
        <div className="mb-6">
          <h4 className="font-medium text-gray-900 mb-3">Your Module NFTs</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {userModules.map((module) => (
              <div key={module.tokenId} className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                <div className="text-sm">
                  <p className="font-medium text-gray-900">{module.moduleName}</p>
                  <p className="text-gray-600">ID: {module.moduleId}</p>
                  <p className="text-gray-500">Token #{module.tokenId}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {rewardInfo && eligibility?.modulesSufficient && eligibility?.hasActiveStake && (
        <div className="mb-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-800 mb-2">Reward Calculation</h4>
            <div className="space-y-1 text-sm text-blue-700">
              <p>Base Reward: {formatSTX(rewardInfo.baseReward)} STX</p>
              <p>Bonus Reward: {formatSTX(rewardInfo.bonusReward)} STX</p>
              <p className="font-medium">Total Reward: {formatSTX(rewardInfo.totalReward)} STX</p>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-center">
        <button
          onClick={handleMintDegree}
          disabled={
            isMinting || 
            !eligibility?.modulesSufficient || 
            !eligibility?.hasActiveStake || 
            eligibility?.alreadyHasDegree
          }
          className="bg-green-600 text-white py-3 px-6 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isMinting ? (
            <span className="flex items-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Minting Degree...
            </span>
          ) : (
            'Mint Degree NFT'
          )}
        </button>
      </div>

      {(!eligibility?.modulesSufficient || !eligibility?.hasActiveStake) && (
        <div className="mt-4 text-center">
          <p className="text-sm text-gray-600">
            Complete all requirements above to mint your degree NFT.
          </p>
        </div>
      )}
    </div>
  );
};
