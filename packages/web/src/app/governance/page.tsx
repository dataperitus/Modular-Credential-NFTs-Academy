'use client';

import { useEffect, useState } from 'react';
import { useGovernanceStore } from '../../../stores/governance';

export default function GovernancePage() {
  const {
    proposals,
    tokenBalance,
    votingPower,
    delegatedTo,
    isLoadingProposals,
    isLoadingTokenData,
    isVoting,
    fetchProposals,
    fetchTokenData,
    submitVote,
  } = useGovernanceStore();

  const [userAddress] = useState('ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM'); // Mock user address

  useEffect(() => {
    fetchProposals();
    fetchTokenData(userAddress);
  }, [fetchProposals, fetchTokenData, userAddress]);

  const formatTokenAmount = (amount: string) => {
    return (parseInt(amount) / 1000000).toLocaleString(); // Convert from microAGT to AGT
  };

  const getProposalStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'succeeded':
        return 'bg-blue-100 text-blue-800';
      case 'executed':
        return 'bg-purple-100 text-purple-800';
      case 'defeated':
        return 'bg-red-100 text-red-800';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleVote = async (proposalId: number, support: boolean) => {
    try {
      await submitVote(proposalId, support, votingPower);
    } catch (error) {
      console.error('Failed to vote:', error);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Governance Dashboard</h1>
          <p className="mt-2 text-gray-600">
            Participate in academy governance by voting on proposals and shaping the future of the platform.
          </p>
        </div>
        <button
          onClick={() => window.location.href = '/governance/create-proposal'}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-md font-medium transition-colors"
        >
          Create Proposal
        </button>
      </div>

      {/* Token Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Token Balance</h3>
          {isLoadingTokenData ? (
            <div className="animate-pulse bg-gray-200 h-8 rounded"></div>
          ) : (
            <p className="text-3xl font-bold text-blue-600">{formatTokenAmount(tokenBalance)} AGT</p>
          )}
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Voting Power</h3>
          {isLoadingTokenData ? (
            <div className="animate-pulse bg-gray-200 h-8 rounded"></div>
          ) : (
            <p className="text-3xl font-bold text-emerald-600">{formatTokenAmount(votingPower)} AGT</p>
          )}
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Delegation Status</h3>
          {isLoadingTokenData ? (
            <div className="animate-pulse bg-gray-200 h-8 rounded"></div>
          ) : (
            <p className="text-lg font-medium text-gray-600">
              {delegatedTo ? `Delegated to ${delegatedTo.slice(0, 8)}...` : 'Self-voting'}
            </p>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-4 mb-8">
        <button
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md font-medium transition-colors"
          onClick={() => window.location.href = '/governance/create-proposal'}
        >
          Create Proposal
        </button>
        <button
          className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-md font-medium transition-colors"
          onClick={() => window.location.href = '/governance/delegate'}
        >
          Manage Delegation
        </button>
      </div>

      {/* Proposals List */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-900">Active Proposals</h2>
        
        {isLoadingProposals ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-lg shadow p-6 animate-pulse">
                <div className="bg-gray-200 h-6 rounded w-3/4 mb-4"></div>
                <div className="bg-gray-200 h-4 rounded w-full mb-2"></div>
                <div className="bg-gray-200 h-4 rounded w-2/3"></div>
              </div>
            ))}
          </div>
        ) : proposals.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-gray-500">No proposals found.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {proposals.map((proposal) => (
              <div key={proposal.id} className="bg-white rounded-lg shadow p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-semibold text-gray-900">{proposal.title}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getProposalStatusColor(proposal.status)}`}>
                        {proposal.status.charAt(0).toUpperCase() + proposal.status.slice(1)}
                      </span>
                    </div>
                    <p className="text-gray-600 mb-3">{proposal.description}</p>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span>Proposed by {proposal.proposer.slice(0, 8)}...</span>
                      <span>Type: {proposal.proposalType}</span>
                      <span>Ends: {new Date(proposal.votingEnd).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                {/* Voting Stats */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-gray-500">For</p>
                    <p className="text-lg font-semibold text-green-600">
                      {formatTokenAmount(proposal.votesFor)} AGT
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Against</p>
                    <p className="text-lg font-semibold text-red-600">
                      {formatTokenAmount(proposal.votesAgainst)} AGT
                    </p>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mb-4">
                  <div className="bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-500 h-2 rounded-full transition-all duration-300"
                      style={{
                        width: `${Math.min(
                          100,
                          (parseInt(proposal.votesFor) / (parseInt(proposal.votesFor) + parseInt(proposal.votesAgainst))) * 100
                        )}%`,
                      }}
                    ></div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Total: {formatTokenAmount(proposal.quorum)} AGT voted
                  </p>
                </div>

                {/* Voting Buttons */}
                {proposal.status === 'active' && (
                  <div className="flex gap-3">
                    <button
                      onClick={() => handleVote(proposal.id, true)}
                      disabled={isVoting}
                      className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white py-2 px-4 rounded-md font-medium transition-colors"
                    >
                      {isVoting ? 'Voting...' : 'Vote For'}
                    </button>
                    <button
                      onClick={() => handleVote(proposal.id, false)}
                      disabled={isVoting}
                      className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white py-2 px-4 rounded-md font-medium transition-colors"
                    >
                      {isVoting ? 'Voting...' : 'Vote Against'}
                    </button>
                  </div>
                )}

                {/* View Details Link */}
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => window.location.href = `/governance/proposals/${proposal.id}`}
                    className="text-blue-600 hover:text-blue-700 font-medium"
                  >
                    View Details →
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
