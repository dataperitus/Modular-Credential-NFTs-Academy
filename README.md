# Modular Credential NFTs Academy

A blockchain-first learning platform that issues each course module as a SIP-009 NFT on the Stacks blockchain. Students assemble module NFTs on-chain as a verifiable transcript, and upon completing all modules, the system auto-mints a non-transferable "Degree" NFT proving curriculum mastery.

## Overview

The Modular Credential NFTs Academy leverages blockchain technology to create immutable, verifiable educational credentials. Each course module is represented as an NFT that students can claim upon completion, building a transparent and portable academic transcript.

### Key Features

- **Module NFTs**: Each course module is a SIP-009 compliant NFT
- **Verifiable Transcripts**: On-chain collection of module NFTs serves as academic record
- **Degree Soulbound Tokens**: Non-transferable degree NFTs auto-minted upon curriculum completion
- **Wallet Integration**: Seamless connection with Stacks wallets via @stacks/connect
- **Decentralized Storage**: IPFS-hosted metadata for NFT content

## Architecture

This project follows a monorepo structure with the following packages:

- **`packages/contracts/`**: Clarity smart contracts for module NFTs and degree SBTs
- **`packages/web/`**: Next.js frontend application with TypeScript
- **`packages/subgraph/`**: The Graph indexing for efficient blockchain data queries
- **`packages/shared/`**: Shared TypeScript types and utilities

## Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Clarinet CLI (v0.27.0 or higher)
- Git

## Development Setup

### 1. Clone and Install Dependencies

```bash
git clone <repository-url>
cd modular-credential-nfts-academy
npm install
```

### 2. Smart Contract Development

```bash
cd packages/contracts
clarinet check
clarinet test
```

### 3. Frontend Development

```bash
cd packages/web
npm run dev
```

### 4. Subgraph Development

```bash
cd packages/subgraph
npm run codegen
npm run build
```

## Build and Deployment

### Smart Contracts

```bash
# Test contracts
npm run test:contracts

# Deploy to testnet
npm run deploy:testnet

# Deploy to mainnet
npm run deploy:mainnet
```

### Frontend Application

```bash
# Build for production
npm run build:web

# Deploy to Vercel
npm run deploy:web
```

### Subgraph

```bash
# Deploy subgraph
npm run deploy:subgraph
```

## Testing

### Unit Tests

```bash
# Test all packages
npm run test

# Test specific package
npm run test:contracts
npm run test:web
```

### Integration Tests

```bash
# End-to-end tests
npm run test:e2e
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Commit Convention

This project follows [Conventional Commits](https://conventionalcommits.org/):

- `feat:` - New features
- `fix:` - Bug fixes
- `docs:` - Documentation changes
- `test:` - Test additions or modifications
- `refactor:` - Code refactoring
- `chore:` - Maintenance tasks

## Technology Stack

- **Smart Contracts**: Clarity v1.4.0
- **Frontend**: Next.js v14, TypeScript v5, @stacks/connect v2.2
- **Indexing**: The Graph (graph-cli v0.32.0)
- **Storage**: IPFS + Pinata
- **Testing**: Clarinet, Jest, Cypress
- **CI/CD**: GitHub Actions

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Documentation

For detailed documentation, please refer to the [docs](./docs) directory:

- [Smart Contract Documentation](./docs/contracts.md)
- [Frontend Development Guide](./docs/frontend.md)
- [Deployment Guide](./docs/deployment.md)
- [API Reference](./docs/api.md)

## Support

For questions and support, please open an issue in the GitHub repository.
