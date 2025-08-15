'use client';

import { useEffect, useState } from 'react';
import { useStakingStore } from '../../stores/staking';
import { useValidationStore } from '../../stores/validation';

export default function ReputationPage() {
  const { 
    validators, 
    userReputation, 
    isLoadingValidators,
    fetchValidators,
    fetchUserReputation 
  } = useStakingStore();
  
  const { completedValidations, fetchUserValidations } = useValidationStore();
  
  const [userAddress] = useState('ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM'); // Mock user address
  const [sortBy, setSortBy] = useState<'score' | 'validations' | 'accuracy'>('score');
  const [filterRank, setFilterRank] = useState<string>('all');

  useEffect(() => {
    fetchValidators();
    fetchUserReputation(userAddress);
    fetchUserValidations(userAddress);
  }, [fetchValidators, fetchUserReputation, fetchUserValidations, userAddress]);

  const getRankFromScore = (score: number): string => {
    if (score >= 900) return 'Legendary';
    if (score >= 800) return 'Expert';
    if (score >= 700) return 'Advanced';
    if (score >= 600) return 'Proficient';
    if (score >= 500) return 'Competent';
    if (score >= 400) return 'Developing';
    if (score >= 300) return 'Novice';
    return 'Unranked';
  };

  const getRankColor = (rank: string): string => {
    switch (rank) {
      case 'Legendary': return 'text-purple-600 bg-purple-100';
      case 'Expert': return 'text-blue-600 bg-blue-100';
      case 'Advanced': return 'text-green-600 bg-green-100';
      case 'Proficient': return 'text-emerald-600 bg-emerald-100';
      case 'Competent': return 'text-yellow-600 bg-yellow-100';
      case 'Developing': return 'text-orange-600 bg-orange-100';
      case 'Novice': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  // Mock reputation data for validators since we don't have it in the store
  const validatorsWithReputation = validators.map(validator => ({
    ...validator,
    reputation: {
      score: Math.floor(Math.random() * 500) + 500, // Random score between 500-1000
      validationsCount: validator.totalValidations,
      successfulValidations: validator.successfulValidations,
      accuracyRate: validator.totalValidations > 0 
        ? (validator.successfulValidations / validator.totalValidations) * 100 
        : 0,
      lastUpdate: Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000, // Random within last 30 days
      rank: '',
    }
  })).map(validator => ({
    ...validator,
    reputation: {
      ...validator.reputation,
      rank: getRankFromScore(validator.reputation.score)
    }
  }));

  const sortedValidators = [...validatorsWithReputation].sort((a, b) => {
    switch (sortBy) {
      case 'score':
        return b.reputation.score - a.reputation.score;
      case 'validations':
        return b.reputation.validationsCount - a.reputation.validationsCount;
      case 'accuracy':
        return b.reputation.accuracyRate - a.reputation.accuracyRate;
      default:
        return 0;
    }
  });

  const filteredValidators = sortedValidators.filter(validator => {
    if (filterRank === 'all') return true;
    return validator.reputation.rank === filterRank;
  });

  const uniqueRanks = [...new Set(validatorsWithReputation.map(v => v.reputation.rank))];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Reputation Center</h1>
        <p className="mt-2 text-gray-600">
          Track validator performance, rankings, and reputation scores in the academy ecosystem.
        </p>
      </div>

      {/* User Reputation Card */}
      {userReputation && (
        <div className="bg-gradient-to-r from-purple-500 to-blue-600 rounded-lg shadow-lg p-6 mb-8 text-white">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <p className="text-lg font-medium opacity-90">Your Reputation</p>
              <p className="text-4xl font-bold">{userReputation.score}</p>
              <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium mt-2 ${getRankColor(userReputation.rank)}`}>
                {userReputation.rank}
              </span>
            </div>
            <div className="text-center">
              <p className="text-lg font-medium opacity-90">Total Validations</p>
              <p className="text-3xl font-bold">{userReputation.validationsCount}</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-medium opacity-90">Accuracy Rate</p>
              <p className="text-3xl font-bold">{userReputation.accuracyRate.toFixed(1)}%</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-medium opacity-90">Successful</p>
              <p className="text-3xl font-bold">{userReputation.successfulValidations}</p>
            </div>
          </div>
        </div>
      )}

      {/* Filters and Sort */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex flex-wrap gap-4 items-center">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Sort by</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="score">Reputation Score</option>
              <option value="validations">Total Validations</option>
              <option value="accuracy">Accuracy Rate</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Rank</label>
            <select
              value={filterRank}
              onChange={(e) => setFilterRank(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Ranks</option>
              {uniqueRanks.map(rank => (
                <option key={rank} value={rank}>{rank}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Validator Leaderboard */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">Validator Leaderboard</h2>
          <p className="text-gray-600">Top performing validators in the academy</p>
        </div>

        {isLoadingValidators ? (
          <div className="p-6">
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center space-x-4 animate-pulse">
                  <div className="bg-gray-200 h-10 w-10 rounded-full"></div>
                  <div className="flex-1">
                    <div className="bg-gray-200 h-4 rounded w-1/3 mb-2"></div>
                    <div className="bg-gray-200 h-3 rounded w-1/2"></div>
                  </div>
                  <div className="bg-gray-200 h-6 rounded w-16"></div>
                </div>
              ))}
            </div>
          </div>
        ) : filteredValidators.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            No validators found matching the selected criteria.
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredValidators.map((validator, index) => (
              <div key={validator.address} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    {/* Rank */}
                    <div className="flex-shrink-0">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white ${
                        index === 0 ? 'bg-yellow-500' : 
                        index === 1 ? 'bg-gray-400' : 
                        index === 2 ? 'bg-orange-500' : 'bg-blue-500'
                      }`}>
                        {index + 1}
                      </div>
                    </div>

                    {/* Validator Info */}
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <p className="font-semibold text-gray-900">
                          {validator.address.slice(0, 8)}...{validator.address.slice(-4)}
                        </p>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRankColor(validator.reputation.rank)}`}>
                          {validator.reputation.rank}
                        </span>
                        {validator.address === userAddress && (
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            You
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{validator.metadata}</p>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-8 text-center">
                    <div>
                      <p className="text-2xl font-bold text-purple-600">{validator.reputation.score}</p>
                      <p className="text-xs text-gray-500">Reputation</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-blue-600">{validator.reputation.validationsCount}</p>
                      <p className="text-xs text-gray-500">Validations</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-green-600">{validator.reputation.accuracyRate.toFixed(1)}%</p>
                      <p className="text-xs text-gray-500">Accuracy</p>
                    </div>
                  </div>
                </div>

                {/* Performance Details */}
                <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div className="bg-gray-50 p-3 rounded">
                    <p className="text-gray-700">
                      <span className="font-medium">Successful Validations:</span> {validator.reputation.successfulValidations}
                    </p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded">
                    <p className="text-gray-700">
                      <span className="font-medium">Registration Block:</span> {validator.registrationBlock.toLocaleString()}
                    </p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded">
                    <p className="text-gray-700">
                      <span className="font-medium">Last Update:</span> {new Date(validator.reputation.lastUpdate).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Reputation System Info */}
      <div className="mt-8 bg-blue-50 rounded-lg p-6">
        <h3 className="text-lg font-bold text-blue-900 mb-4">How Reputation Works</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-semibold text-blue-800 mb-2">Reputation Ranks</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Legendary</span>
                <span className="text-blue-600">900+ points</span>
              </div>
              <div className="flex justify-between">
                <span>Expert</span>
                <span className="text-blue-600">800-899 points</span>
              </div>
              <div className="flex justify-between">
                <span>Advanced</span>
                <span className="text-blue-600">700-799 points</span>
              </div>
              <div className="flex justify-between">
                <span>Proficient</span>
                <span className="text-blue-600">600-699 points</span>
              </div>
            </div>
          </div>
          <div>
            <h4 className="font-semibold text-blue-800 mb-2">Reputation Factors</h4>
            <ul className="space-y-1 text-sm text-blue-700">
              <li>• Validation accuracy and consensus with other validators</li>
              <li>• Consistency and frequency of participation</li>
              <li>• Quality of feedback provided in validations</li>
              <li>• Time decay for inactive periods</li>
              <li>• Community governance participation</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
