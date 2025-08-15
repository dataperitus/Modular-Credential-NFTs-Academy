'use client';

import { useEffect, useState } from 'react';
import { useValidationStore } from '../../stores/validation';
import { useStakingStore } from '../../stores/staking';

export default function ValidationPage() {
  const {
    pendingValidations,
    userValidations,
    completedValidations,
    isLoadingValidations,
    isSubmittingValidation,
    isDisputingValidation,
    fetchPendingValidations,
    fetchUserValidations,
    submitValidation,
    disputeValidation,
    submitModuleForValidation,
  } = useValidationStore();

  const { isValidator, userReputation } = useStakingStore();

  const [userAddress] = useState('ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM'); // Mock user address
  const [selectedValidation, setSelectedValidation] = useState<number | null>(null);
  const [validationScore, setValidationScore] = useState(80);
  const [validationFeedback, setValidationFeedback] = useState('');
  const [disputeReason, setDisputeReason] = useState('');
  const [newModuleId, setNewModuleId] = useState('');

  useEffect(() => {
    fetchPendingValidations();
    if (isValidator) {
      fetchUserValidations(userAddress);
    }
  }, [fetchPendingValidations, fetchUserValidations, isValidator, userAddress]);

  const handleSubmitValidation = async () => {
    if (selectedValidation === null || !validationFeedback) return;
    
    try {
      await submitValidation(selectedValidation, validationScore, validationFeedback);
      setSelectedValidation(null);
      setValidationScore(80);
      setValidationFeedback('');
    } catch (error) {
      console.error('Failed to submit validation:', error);
    }
  };

  const handleDisputeValidation = async (validationId: number) => {
    if (!disputeReason) return;
    
    try {
      await disputeValidation(validationId, disputeReason);
      setDisputeReason('');
    } catch (error) {
      console.error('Failed to dispute validation:', error);
    }
  };

  const handleSubmitModuleForValidation = async () => {
    if (!newModuleId) return;
    
    try {
      await submitModuleForValidation(parseInt(newModuleId));
      setNewModuleId('');
    } catch (error) {
      console.error('Failed to submit module for validation:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'disputed':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (!isValidator) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Validation Portal</h1>
          <p className="text-gray-600 mb-6">
            You need to be a registered validator to access the validation portal.
          </p>
          <button
            onClick={() => window.location.href = '/staking'}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md font-medium transition-colors"
          >
            Go to Staking Portal
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Validation Portal</h1>
        <p className="mt-2 text-gray-600">
          Review and validate course modules to maintain quality standards and earn rewards.
        </p>
      </div>

      {/* Validator Stats */}
      {userReputation && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Reputation Score</h3>
            <p className="text-3xl font-bold text-purple-600">{userReputation.score}</p>
            <p className="text-sm text-gray-500">{userReputation.rank}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Total Validations</h3>
            <p className="text-3xl font-bold text-blue-600">{userReputation.validationsCount}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Accuracy Rate</h3>
            <p className="text-3xl font-bold text-green-600">{userReputation.accuracyRate.toFixed(1)}%</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Successful</h3>
            <p className="text-3xl font-bold text-emerald-600">{userReputation.successfulValidations}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Pending Validations */}
        <div>
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Pending Validations</h2>
            
            {isLoadingValidations ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="border border-gray-200 rounded-lg p-4 animate-pulse">
                    <div className="bg-gray-200 h-4 rounded w-1/2 mb-2"></div>
                    <div className="bg-gray-200 h-3 rounded w-3/4"></div>
                  </div>
                ))}
              </div>
            ) : pendingValidations.length === 0 ? (
              <p className="text-gray-500">No pending validations available.</p>
            ) : (
              <div className="space-y-4">
                {pendingValidations.map((validation) => (
                  <div key={validation.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <p className="font-semibold text-gray-900">Module #{validation.moduleId}</p>
                        <p className="text-sm text-gray-500">
                          Validators: {validation.validators.length}/3 required
                        </p>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(validation.status)}`}>
                        {validation.status}
                      </span>
                    </div>

                    {validation.scores.length > 0 && (
                      <div className="mb-3">
                        <p className="text-sm font-medium text-gray-700 mb-2">Current Scores:</p>
                        <div className="flex gap-2">
                          {validation.scores.map((score, index) => (
                            <span
                              key={index}
                              className={`px-2 py-1 rounded text-sm font-medium ${getScoreColor(score)} bg-gray-100`}
                            >
                              {score}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {!validation.validators.includes(userAddress) && validation.validators.length < 3 && (
                      <button
                        onClick={() => setSelectedValidation(validation.id)}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md font-medium transition-colors"
                      >
                        Review Module
                      </button>
                    )}

                    {validation.validators.includes(userAddress) && (
                      <div className="bg-blue-50 p-3 rounded">
                        <p className="text-sm text-blue-700">You have already validated this module.</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Submit Module for Validation */}
          <div className="bg-white rounded-lg shadow p-6 mt-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Submit Module for Validation</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Module ID
                </label>
                <input
                  type="number"
                  value={newModuleId}
                  onChange={(e) => setNewModuleId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter module ID"
                />
              </div>
              <button
                onClick={handleSubmitModuleForValidation}
                disabled={!newModuleId}
                className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white py-2 px-4 rounded-md font-medium transition-colors"
              >
                Submit for Validation
              </button>
            </div>
          </div>
        </div>

        {/* Validation Form & Completed Validations */}
        <div className="space-y-6">
          {/* Validation Form */}
          {selectedValidation !== null && (
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                Validate Module #{pendingValidations.find(v => v.id === selectedValidation)?.moduleId}
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Quality Score (0-100)
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={validationScore}
                    onChange={(e) => setValidationScore(parseInt(e.target.value))}
                    className="w-full"
                  />
                  <div className="flex justify-between text-sm text-gray-500">
                    <span>0</span>
                    <span className={`font-medium ${getScoreColor(validationScore)}`}>
                      {validationScore}
                    </span>
                    <span>100</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Feedback
                  </label>
                  <textarea
                    value={validationFeedback}
                    onChange={(e) => setValidationFeedback(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={4}
                    placeholder="Provide detailed feedback on the module quality, accuracy, and educational value..."
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={handleSubmitValidation}
                    disabled={isSubmittingValidation || !validationFeedback}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white py-2 px-4 rounded-md font-medium transition-colors"
                  >
                    {isSubmittingValidation ? 'Submitting...' : 'Submit Validation'}
                  </button>
                  <button
                    onClick={() => {
                      setSelectedValidation(null);
                      setValidationScore(80);
                      setValidationFeedback('');
                    }}
                    className="bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded-md font-medium transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Completed Validations */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Completed Validations</h3>
            
            {completedValidations.length === 0 ? (
              <p className="text-gray-500">No completed validations yet.</p>
            ) : (
              <div className="space-y-4">
                {completedValidations.map((validation) => (
                  <div key={validation.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <p className="font-semibold text-gray-900">Module #{validation.moduleId}</p>
                        <p className="text-sm text-gray-500">
                          Final Score: <span className={`font-medium ${getScoreColor(validation.finalScore)}`}>
                            {validation.finalScore}
                          </span>
                        </p>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(validation.status)}`}>
                        {validation.status}
                      </span>
                    </div>

                    <div className="mb-3">
                      <p className="text-sm font-medium text-gray-700 mb-1">All Scores:</p>
                      <div className="flex gap-2">
                        {validation.scores.map((score, index) => (
                          <span
                            key={index}
                            className={`px-2 py-1 rounded text-sm font-medium ${getScoreColor(score)} bg-gray-100`}
                          >
                            {score}
                          </span>
                        ))}
                      </div>
                    </div>

                    {validation.feedbacks.length > 0 && (
                      <div className="mb-3">
                        <p className="text-sm font-medium text-gray-700 mb-2">Feedback:</p>
                        <div className="space-y-2">
                          {validation.feedbacks.map((feedback, index) => (
                            <p key={index} className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                              {feedback}
                            </p>
                          ))}
                        </div>
                      </div>
                    )}

                    {validation.status === 'approved' && validation.finalScore < 70 && (
                      <div className="mt-3">
                        <input
                          type="text"
                          value={disputeReason}
                          onChange={(e) => setDisputeReason(e.target.value)}
                          className="w-full px-3 py-2 mb-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                          placeholder="Reason for dispute..."
                        />
                        <button
                          onClick={() => handleDisputeValidation(validation.id)}
                          disabled={isDisputingValidation || !disputeReason}
                          className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white py-2 px-4 rounded-md text-sm font-medium transition-colors"
                        >
                          {isDisputingValidation ? 'Disputing...' : 'Dispute Validation'}
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
