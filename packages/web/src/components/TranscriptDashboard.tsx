'use client';

import React, { useState, useEffect } from 'react';
import { ModuleNFT, DegreeSBT, UserTranscript } from '@modular-nft-academy/shared';
import { StakingInterface } from './StakingInterface';
import { DegreeMinting } from './DegreeMinting';

interface TranscriptDashboardProps {
  userAddress?: string;
}

interface TransactionStatus {
  txId: string;
  type: 'stake' | 'mint-degree' | 'mint-module';
  status: 'pending' | 'confirmed' | 'failed';
  timestamp: number;
}

export const TranscriptDashboard: React.FC<TranscriptDashboardProps> = ({
  userAddress
}) => {
  const [transcript, setTranscript] = useState<UserTranscript | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'modules' | 'staking' | 'degree'>('overview');
  const [transactions, setTransactions] = useState<TransactionStatus[]>([]);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    if (userAddress) {
      fetchTranscript();
      fetchTransactions();
    }
  }, [userAddress]);

  const fetchTranscript = async () => {
    if (!userAddress) return;
    
    setIsLoading(true);
    try {
      const response = await fetch(`/api/transcript/${userAddress}`);
      if (response.ok) {
        const transcriptData = await response.json();
        setTranscript(transcriptData);
      }
    } catch (error) {
      console.error('Error fetching transcript:', error);
      showNotification('error', 'Failed to load transcript data');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTransactions = async () => {
    if (!userAddress) return;
    
    try {
      const response = await fetch(`/api/transactions/${userAddress}`);
      if (response.ok) {
        const transactionData = await response.json();
        setTransactions(transactionData);
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
    }
  };

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  const handleStakeSuccess = (txId: string) => {
    showNotification('success', 'Staking transaction submitted successfully!');
    setTransactions(prev => [...prev, {
      txId,
      type: 'stake',
      status: 'pending',
      timestamp: Date.now()
    }]);
    // Refresh data after a delay to allow for blockchain confirmation
    setTimeout(fetchTranscript, 3000);
  };

  const handleStakeError = (error: string) => {
    showNotification('error', `Staking failed: ${error}`);
  };

  const handleMintSuccess = (txId: string) => {
    showNotification('success', 'Degree minting transaction submitted successfully!');
    setTransactions(prev => [...prev, {
      txId,
      type: 'mint-degree',
      status: 'pending',
      timestamp: Date.now()
    }]);
    setTimeout(fetchTranscript, 3000);
  };

  const handleMintError = (error: string) => {
    showNotification('error', `Degree minting failed: ${error}`);
  };

  const getProgressPercentage = (): number => {
    if (!transcript) return 0;
    const requiredModules = 3; // This should come from contract config
    return Math.min((transcript.totalModulesCompleted / requiredModules) * 100, 100);
  };

  const formatDate = (timestamp: number): string => {
    return new Date(timestamp).toLocaleDateString();
  };

  const getTransactionStatusColor = (status: string): string => {
    switch (status) {
      case 'confirmed': return 'text-green-600';
      case 'failed': return 'text-red-600';
      default: return 'text-yellow-600';
    }
  };

  if (!userAddress) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800">Please connect your wallet to view your transcript.</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-gray-200 h-24 rounded-lg"></div>
            ))}
          </div>
          <div className="h-64 bg-gray-200 rounded-lg"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Notification */}
      {notification && (
        <div className={`mb-6 p-4 rounded-lg ${
          notification.type === 'success' 
            ? 'bg-green-50 border border-green-200 text-green-800' 
            : 'bg-red-50 border border-red-200 text-red-800'
        }`}>
          {notification.message}
        </div>
      )}

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Academic Transcript</h1>
        <p className="text-gray-600">Track your progress through the Modular Credential NFTs Academy</p>
      </div>

      {/* Progress Overview */}
      {transcript && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Modules Completed</h3>
            <div className="text-3xl font-bold text-blue-600">{transcript.totalModulesCompleted}</div>
            <div className="text-sm text-gray-500">of 3 required</div>
          </div>
          
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Progress</h3>
            <div className="text-3xl font-bold text-green-600">{Math.round(getProgressPercentage())}%</div>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div 
                className="bg-green-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${getProgressPercentage()}%` }}
              ></div>
            </div>
          </div>
          
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Degree Status</h3>
            <div className={`text-3xl font-bold ${transcript.degreeNFT ? 'text-green-600' : 'text-gray-400'}`}>
              {transcript.degreeNFT ? 'Earned' : 'Pending'}
            </div>
            <div className="text-sm text-gray-500">
              {transcript.isEligibleForDegree ? 'Eligible to mint' : 'Complete requirements'}
            </div>
          </div>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'overview', label: 'Overview' },
            { id: 'modules', label: 'Modules' },
            { id: 'staking', label: 'Staking' },
            { id: 'degree', label: 'Degree' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="space-y-6">
        {activeTab === 'overview' && transcript && (
          <div className="space-y-6">
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
              {transactions.length > 0 ? (
                <div className="space-y-3">
                  {transactions.slice(0, 5).map((tx) => (
                    <div key={tx.txId} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                      <div>
                        <p className="text-sm font-medium text-gray-900 capitalize">
                          {tx.type.replace('-', ' ')}
                        </p>
                        <p className="text-xs text-gray-500">{formatDate(tx.timestamp)}</p>
                      </div>
                      <span className={`text-sm font-medium ${getTransactionStatusColor(tx.status)} capitalize`}>
                        {tx.status}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No recent activity</p>
              )}
            </div>
          </div>
        )}

        {activeTab === 'modules' && transcript && (
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Module NFTs</h3>
            {transcript.moduleNFTs.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {transcript.moduleNFTs.map((module) => (
                  <div key={module.tokenId} className="border border-gray-200 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-2">{module.moduleName}</h4>
                    <div className="space-y-1 text-sm text-gray-600">
                      <p>Module ID: {module.moduleId}</p>
                      <p>Token ID: #{module.tokenId}</p>
                      <p>Completed: Block {module.completionDate}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No module NFTs earned yet</p>
            )}
          </div>
        )}

        {activeTab === 'staking' && (
          <StakingInterface
            userAddress={userAddress}
            onStakeSuccess={handleStakeSuccess}
            onStakeError={handleStakeError}
          />
        )}

        {activeTab === 'degree' && (
          <DegreeMinting
            userAddress={userAddress}
            onMintSuccess={handleMintSuccess}
            onMintError={handleMintError}
          />
        )}
      </div>
    </div>
  );
};
