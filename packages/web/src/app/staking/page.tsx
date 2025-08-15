'use client';

import { useEffect, useState } from 'react';
import { useStakingStore } from '../../stores/staking';

export default function StakingPage() {
  const {
    userStakes,
    totalStaked,
    availableRewards,
    isValidator,
    validatorInfo,
    validators,
    userReputation,
    isLoadingStakes,
    isLoadingValidators,
    isStaking,
    isUnstaking,
    isRegisteringValidator,
    fetchUserStakes,
    fetchValidators,
    fetchUserReputation,
    stake,
    unstake,
    claimRewards,
    registerValidator,
    deregisterValidator,
  } = useStakingStore();

  const [userAddress] = useState('ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM'); // Mock user address
  const [stakeAmount, setStakeAmount] = useState('');
  const [lockPeriod, setLockPeriod] = useState(52560); // 1 year default
  const [validatorMetadata, setValidatorMetadata] = useState('');

  useEffect(() => {
    fetchUserStakes(userAddress);
    fetchValidators();
    fetchUserReputation(userAddress);
  }, [fetchUserStakes, fetchValidators, fetchUserReputation, userAddress]);

  const formatTokenAmount = (amount: string) => {
    return (parseInt(amount) / 1000000).toLocaleString(); // Convert from microAGT to AGT
  };

  const formatBlocksToTime = (blocks: number) => {
    const days = Math.floor(blocks / 144); // Assuming 144 blocks per day
    if (days > 365) {
      return `${Math.floor(days / 365)} year(s)`;
    } else if (days > 30) {
      return `${Math.floor(days / 30)} month(s)`;
    } else {
      return `${days} day(s)`;
    }
  };

  const handleStake = async () => {
    if (!stakeAmount) return;
    try {
      const amountInMicro = (parseFloat(stakeAmount) * 1000000).toString();
      await stake(amountInMicro, lockPeriod);
      setStakeAmount('');
    } catch (error) {
      console.error('Failed to stake:', error);
    }
  };

  const handleUnstake = async (stakeId: number) => {
    try {
      await unstake(stakeId);
    } catch (error) {
      console.error('Failed to unstake:', error);
    }
  };

  const handleClaimRewards = async (stakeId: number) => {
    try {
      await claimRewards(stakeId);
    } catch (error) {
      console.error('Failed to claim rewards:', error);
    }
  };

  const handleRegisterValidator = async () => {
    if (!validatorMetadata) return;
    try {
      await registerValidator(validatorMetadata);
      setValidatorMetadata('');
    } catch (error) {
      console.error('Failed to register as validator:', error);
    }
  };

  const handleDeregisterValidator = async () => {
    try {
      await deregisterValidator();
    } catch (error) {
      console.error('Failed to deregister validator:', error);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Staking Portal</h1>
        <p className="mt-2 text-gray-600">
          Stake your governance tokens to earn rewards and become eligible for validator roles.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Total Staked</h3>
          {isLoadingStakes ? (
            <div className="animate-pulse bg-gray-200 h-8 rounded"></div>
          ) : (
            <p className="text-3xl font-bold text-emerald-600">{formatTokenAmount(totalStaked)} AGT</p>
          )}
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Available Rewards</h3>
          {isLoadingStakes ? (
            <div className="animate-pulse bg-gray-200 h-8 rounded"></div>
          ) : (
            <p className="text-3xl font-bold text-yellow-600">{formatTokenAmount(availableRewards)} AGT</p>
          )}
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Validator Status</h3>
          <p className={`text-lg font-medium ${isValidator ? 'text-green-600' : 'text-gray-600'}`}>
            {isValidator ? 'Active Validator' : 'Not a Validator'}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Reputation Score</h3>
          {userReputation ? (
            <div>
              <p className="text-3xl font-bold text-purple-600">{userReputation.score}</p>
              <p className="text-sm text-gray-500">{userReputation.rank}</p>
            </div>
          ) : (
            <p className="text-lg font-medium text-gray-600">Not Available</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Staking Section */}
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Stake Tokens</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Stake Amount (AGT)
                </label>
                <input
                  type="number"
                  value={stakeAmount}
                  onChange={(e) => setStakeAmount(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="Enter amount to stake"
                  min="1000"
                />
                <p className="text-xs text-gray-500 mt-1">Minimum stake: 1,000 AGT</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Lock Period
                </label>
                <select
                  value={lockPeriod}
                  onChange={(e) => setLockPeriod(parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value={7560}>1 month (5% APY)</option>
                  <option value={26280}>6 months (7% APY)</option>
                  <option value={52560}>1 year (10% APY)</option>
                </select>
              </div>

              <button
                onClick={handleStake}
                disabled={isStaking || !stakeAmount || parseFloat(stakeAmount) < 1000}
                className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-400 text-white py-3 px-4 rounded-md font-medium transition-colors"
              >
                {isStaking ? 'Staking...' : 'Stake Tokens'}
              </button>
            </div>
          </div>

          {/* Validator Registration */}
          {!isValidator && parseInt(totalStaked) >= 1000000000 && (
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Become a Validator</h3>
              <p className="text-gray-600 mb-4">
                You have sufficient stake to become a validator. Validators can review and validate course modules.
              </p>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Validator Description
                  </label>
                  <textarea
                    value={validatorMetadata}
                    onChange={(e) => setValidatorMetadata(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                    placeholder="Describe your qualifications and experience..."
                  />
                </div>

                <button
                  onClick={handleRegisterValidator}
                  disabled={isRegisteringValidator || !validatorMetadata}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white py-3 px-4 rounded-md font-medium transition-colors"
                >
                  {isRegisteringValidator ? 'Registering...' : 'Register as Validator'}
                </button>
              </div>
            </div>
          )}

          {/* Validator Info */}
          {isValidator && validatorInfo && (
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Validator Information</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-gray-700">Description</p>
                  <p className="text-gray-600">{validatorInfo.metadata}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-700">Total Validations</p>
                    <p className="text-lg font-semibold text-blue-600">{validatorInfo.totalValidations}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">Success Rate</p>
                    <p className="text-lg font-semibold text-green-600">
                      {validatorInfo.totalValidations > 0 
                        ? Math.round((validatorInfo.successfulValidations / validatorInfo.totalValidations) * 100)
                        : 0}%
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleDeregisterValidator}
                  className="w-full bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-md font-medium transition-colors"
                >
                  Deregister Validator
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Stakes List */}
        <div>
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Your Stakes</h2>
            
            {isLoadingStakes ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="border border-gray-200 rounded-lg p-4 animate-pulse">
                    <div className="bg-gray-200 h-4 rounded w-1/2 mb-2"></div>
                    <div className="bg-gray-200 h-3 rounded w-3/4"></div>
                  </div>
                ))}
              </div>
            ) : userStakes.length === 0 ? (
              <p className="text-gray-500">No stakes found. Start by staking some tokens!</p>
            ) : (
              <div className="space-y-4">
                {userStakes.map((userStake) => (
                  <div key={userStake.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <p className="text-lg font-semibold text-gray-900">
                          {formatTokenAmount(userStake.amount)} AGT
                        </p>
                        <p className="text-sm text-gray-500">
                          Lock Period: {formatBlocksToTime(userStake.lockPeriod)}
                        </p>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        userStake.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {userStake.active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 mb-3">
                      <div>
                        <p>Start Block: {userStake.startBlock.toLocaleString()}</p>
                        <p>End Block: {userStake.endBlock.toLocaleString()}</p>
                      </div>
                      <div>
                        <p>Claimed Rewards: {formatTokenAmount(userStake.claimedRewards)} AGT</p>
                        <p>Estimated Rewards: 25 AGT</p>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleClaimRewards(userStake.id)}
                        className="flex-1 bg-yellow-600 hover:bg-yellow-700 text-white py-2 px-3 rounded-md text-sm font-medium transition-colors"
                      >
                        Claim Rewards
                      </button>
                      
                      {userStake.active && userStake.endBlock <= 152560 && (
                        <button
                          onClick={() => handleUnstake(userStake.id)}
                          disabled={isUnstaking}
                          className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white py-2 px-3 rounded-md text-sm font-medium transition-colors"
                        >
                          {isUnstaking ? 'Unstaking...' : 'Unstake'}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Validators List */}
      <div className="mt-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Active Validators</h2>
          
          {isLoadingValidators ? (
            <div className="animate-pulse space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="border border-gray-200 rounded-lg p-4">
                  <div className="bg-gray-200 h-4 rounded w-1/3 mb-2"></div>
                  <div className="bg-gray-200 h-3 rounded w-2/3"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {validators.map((validator) => (
                <div key={validator.address} className="border border-gray-200 rounded-lg p-4">
                  <div className="mb-3">
                    <p className="font-medium text-gray-900">{validator.address.slice(0, 12)}...</p>
                    <p className="text-sm text-gray-600 mt-1">{validator.metadata}</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <p className="text-gray-500">Validations</p>
                      <p className="font-semibold">{validator.totalValidations}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Success Rate</p>
                      <p className="font-semibold text-green-600">
                        {validator.totalValidations > 0 
                          ? Math.round((validator.successfulValidations / validator.totalValidations) * 100)
                          : 0}%
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
