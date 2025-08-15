'use client';

import { useState } from 'react';
import { useGovernanceStore } from '../../../stores/governance';

export default function CreateProposalPage() {
  const { createProposal, tokenBalance, isLoadingTokenData } = useGovernanceStore();
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [proposalType, setProposalType] = useState('general');
  const [metadataUri, setMetadataUri] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const minimumTokens = 100000000; // 100 tokens in micro-AGT
  const hasEnoughTokens = parseInt(tokenBalance) >= minimumTokens;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title || !description || !hasEnoughTokens) return;
    
    setIsSubmitting(true);
    setSubmitStatus('idle');
    
    try {
      await createProposal(title, description, proposalType, metadataUri || undefined);
      setSubmitStatus('success');
      
      // Reset form
      setTitle('');
      setDescription('');
      setProposalType('general');
      setMetadataUri('');
      
      // Redirect after success
      setTimeout(() => {
        window.location.href = '/governance';
      }, 2000);
    } catch (error) {
      console.error('Failed to create proposal:', error);
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTokenAmount = (amount: string) => {
    return (parseInt(amount) / 1000000).toLocaleString();
  };

  const getProposalTypeDescription = (type: string) => {
    switch (type) {
      case 'parameter':
        return 'Changes to protocol parameters (staking amounts, validation thresholds, etc.)';
      case 'upgrade':
        return 'Smart contract upgrades or protocol improvements';
      case 'funding':
        return 'Treasury funding for development or community initiatives';
      case 'general':
        return 'General governance decisions and community matters';
      default:
        return '';
    }
  };

  if (!hasEnoughTokens) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Create Proposal</h1>
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
            <p className="text-red-800 font-medium mb-2">Insufficient Tokens</p>
            <p className="text-red-600 mb-4">
              You need at least 100 AGT to create a proposal. You currently have {formatTokenAmount(tokenBalance)} AGT.
            </p>
            <p className="text-red-600 text-sm">
              Acquire more governance tokens through staking rewards or community participation.
            </p>
          </div>
          <button
            onClick={() => window.location.href = '/governance'}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md font-medium transition-colors"
          >
            Back to Governance
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Create Proposal</h1>
        <p className="mt-2 text-gray-600">
          Submit a proposal for community governance. All proposals require at least 100 AGT and will enter a voting period.
        </p>
      </div>

      {/* Token Status */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium text-green-800">
              You have {formatTokenAmount(tokenBalance)} AGT - eligible to create proposals
            </p>
          </div>
        </div>
      </div>

      {/* Success/Error Messages */}
      {submitStatus === 'success' && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
          <p className="text-green-800 font-medium">Proposal created successfully!</p>
          <p className="text-green-600 text-sm">Redirecting to governance dashboard...</p>
        </div>
      )}

      {submitStatus === 'error' && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-800 font-medium">Failed to create proposal</p>
          <p className="text-red-600 text-sm">Please try again or check your transaction.</p>
        </div>
      )}

      {/* Proposal Form */}
      <div className="bg-white rounded-lg shadow p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
              Proposal Title *
            </label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter a clear, descriptive title"
              maxLength={128}
              required
            />
            <p className="text-xs text-gray-500 mt-1">{title.length}/128 characters</p>
          </div>

          {/* Proposal Type */}
          <div>
            <label htmlFor="proposalType" className="block text-sm font-medium text-gray-700 mb-2">
              Proposal Type *
            </label>
            <select
              id="proposalType"
              value={proposalType}
              onChange={(e) => setProposalType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="general">General</option>
              <option value="parameter">Parameter Change</option>
              <option value="upgrade">Protocol Upgrade</option>
              <option value="funding">Treasury Funding</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">
              {getProposalTypeDescription(proposalType)}
            </p>
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              Proposal Description *
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={8}
              placeholder="Provide a detailed description of the proposal, including:
- What changes are being proposed
- Why these changes are necessary
- Expected impact on the community
- Implementation timeline if applicable"
              maxLength={512}
              required
            />
            <p className="text-xs text-gray-500 mt-1">{description.length}/512 characters</p>
          </div>

          {/* Metadata URI (Optional) */}
          <div>
            <label htmlFor="metadataUri" className="block text-sm font-medium text-gray-700 mb-2">
              Additional Documentation URL (Optional)
            </label>
            <input
              type="url"
              id="metadataUri"
              value={metadataUri}
              onChange={(e) => setMetadataUri(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="https://example.com/proposal-details"
            />
            <p className="text-xs text-gray-500 mt-1">
              Link to detailed documentation, charts, or additional resources
            </p>
          </div>

          {/* Voting Information */}
          <div className="bg-blue-50 rounded-lg p-4">
            <h3 className="text-lg font-medium text-blue-900 mb-2">Voting Information</h3>
            <div className="space-y-2 text-sm text-blue-800">
              <p>• Voting will begin 24 hours after proposal creation</p>
              <p>• Voting period lasts for 7 days</p>
              <p>• Execution delay of 24 hours after voting ends</p>
              <p>• Requires 20% quorum of total token supply</p>
              <p>• Simple majority (&gt;50%) needed to pass</p>
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              disabled={isSubmitting || !title || !description || !hasEnoughTokens}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white py-3 px-4 rounded-md font-medium transition-colors"
            >
              {isSubmitting ? 'Creating Proposal...' : 'Create Proposal'}
            </button>
            
            <button
              type="button"
              onClick={() => window.location.href = '/governance'}
              className="bg-gray-600 hover:bg-gray-700 text-white py-3 px-4 rounded-md font-medium transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>

      {/* Guidelines */}
      <div className="mt-8 bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Proposal Guidelines</h3>
        <div className="space-y-3 text-sm text-gray-700">
          <div>
            <p className="font-medium">📝 Be Clear and Specific</p>
            <p>Write clear titles and detailed descriptions. Avoid ambiguity.</p>
          </div>
          <div>
            <p className="font-medium">🎯 Stay On Topic</p>
            <p>Ensure proposals align with the academy's mission and governance scope.</p>
          </div>
          <div>
            <p className="font-medium">📊 Provide Evidence</p>
            <p>Support proposals with data, research, or community feedback when possible.</p>
          </div>
          <div>
            <p className="font-medium">🤝 Engage the Community</p>
            <p>Discuss proposals in community forums before formal submission.</p>
          </div>
          <div>
            <p className="font-medium">⚡ Consider Impact</p>
            <p>Think about technical feasibility and resource requirements.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
