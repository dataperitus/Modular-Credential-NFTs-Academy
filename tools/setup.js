#!/usr/bin/env node

/**
 * Setup script for Modular Credential NFTs Academy
 * Initializes development environment and installs dependencies
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Setting up Modular Credential NFTs Academy...\n');

// Check if required tools are installed
function checkRequirements() {
  console.log('📋 Checking requirements...');
  
  const requirements = [
    { command: 'node --version', name: 'Node.js' },
    { command: 'npm --version', name: 'npm' },
    { command: 'clarinet --version', name: 'Clarinet' },
    { command: 'git --version', name: 'Git' }
  ];

  for (const req of requirements) {
    try {
      execSync(req.command, { stdio: 'ignore' });
      console.log(`✅ ${req.name} is installed`);
    } catch (error) {
      console.log(`❌ ${req.name} is not installed or not in PATH`);
      process.exit(1);
    }
  }
  console.log('');
}

// Install dependencies
function installDependencies() {
  console.log('📦 Installing dependencies...');
  
  try {
    execSync('npm install', { stdio: 'inherit' });
    console.log('✅ Dependencies installed successfully\n');
  } catch (error) {
    console.log('❌ Failed to install dependencies');
    process.exit(1);
  }
}

// Create environment files
function createEnvFiles() {
  console.log('🔧 Creating environment files...');
  
  const webEnvExample = `# Stacks Network Configuration
NEXT_PUBLIC_STACKS_NETWORK=testnet
NEXT_PUBLIC_CONTRACT_ADDRESS=

# API Configuration
NEXT_PUBLIC_API_URL=https://api.modular-nft-academy.com

# IPFS Configuration
NEXT_PUBLIC_IPFS_GATEWAY=https://ipfs.io/ipfs/
`;

  const webEnvPath = path.join(__dirname, '../packages/web/.env.example');
  fs.writeFileSync(webEnvPath, webEnvExample);
  console.log('✅ Created .env.example files\n');
}

// Run setup
function main() {
  checkRequirements();
  installDependencies();
  createEnvFiles();
  
  console.log('🎉 Setup complete!');
  console.log('\nNext steps:');
  console.log('1. Copy .env.example to .env in packages/web and configure');
  console.log('2. Run "npm run dev:web" to start the frontend');
  console.log('3. Run "npm run test:contracts" to test smart contracts');
  console.log('4. See README.md for detailed development instructions');
}

main();
