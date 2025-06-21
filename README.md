# 🚀 Stellar Salary Streaming Platform

A decentralized salary streaming platform built on Stellar/Soroban blockchain that enables real-time salary payments with lending capabilities.

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Architecture](#architecture)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Usage](#usage)
- [Smart Contracts](#smart-contracts)
- [Frontend Structure](#frontend-structure)
- [API Reference](#api-reference)
- [Security](#security)
- [Contributing](#contributing)
- [License](#license)

## 🎯 Overview

This platform revolutionizes traditional payroll systems by enabling continuous, real-time salary streaming on the Stellar blockchain. Employees receive their earnings as they work, rather than waiting for monthly paychecks. The system also includes a lending feature that allows employees to borrow against their future earnings.

### Key Benefits

- **Real-time Payments**: Employees get paid every second they work
- **No Waiting Periods**: Access to earned money immediately
- **Transparent**: All transactions are recorded on the blockchain
- **Lending Against Future Earnings**: Borrow money based on salary streams
- **Low Fees**: Stellar's low transaction costs
- **Decentralized**: No central authority controlling payments

## ✨ Features

### 💰 Salary Streaming
- Create continuous payment streams for employees
- Real-time balance calculations
- Partial and full withdrawals
- Stream management (pause, resume, end)
- Multi-stream support per employee

### 🏦 Lending System
- Borrow against future salary streams
- Automatic loan calculations based on stream value
- Interest rate management
- Repayment tracking
- Credit scoring based on work history

### 👤 Work Profile Management
- Professional work history on-chain
- Experience verification
- Skill tracking
- Reputation system

### 🔐 Security Features
- Freighter wallet integration
- Multi-signature support
- Role-based access control
- Admin-only stream creation
- Employee-only withdrawals

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │  Smart Contracts │    │   Stellar       │
│   (Next.js)     │◄──►│   (Soroban)     │◄──►│   Network       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
        │                       │                       │
        │                       │                       │
        ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Freighter      │    │  Contract State │    │  XLM Ledger     │
│  Wallet         │    │  & Logic        │    │  & Transactions │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Technology Stack

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS
- **Blockchain**: Stellar Network, Soroban Smart Contracts
- **Wallet**: Freighter Browser Extension
- **Smart Contracts**: Rust (Soroban SDK)
- **Development**: Node.js, Cargo

## 📋 Prerequisites

Before running this project, ensure you have:

### Software Requirements
- **Node.js** (v18 or higher)
- **Rust** (latest stable)
- **Stellar CLI** (latest version)
- **Freighter Wallet** browser extension

### Blockchain Requirements
- Stellar account with XLM for fees
- Access to Stellar Testnet or Mainnet
- Deployed smart contracts (addresses configured)

### Browser Setup
1. Install [Freighter Wallet](https://freighter.app/)
2. Create or import a Stellar account
3. Fund account with XLM (testnet faucet available)

## 🚀 Installation

### 1. Clone the Repository
```bash
git clone <repository-url>
cd stellar-salary-streaming
```

### 2. Install Dependencies

#### Frontend Dependencies
```bash
cd frontend
npm install
```

#### Smart Contract Dependencies
```bash
cd contracts
cargo build
```

### 3. Smart Contract Deployment

#### Deploy Salary Streaming Contract
```bash
cd contracts/salary-streaming
stellar contract deploy \
  --wasm target/wasm32-unknown-unknown/release/salary_streaming.wasm \
  --source-account <YOUR_ACCOUNT> \
  --network testnet
```

#### Deploy Lending Contract
```bash
cd contracts/lending
stellar contract deploy \
  --wasm target/wasm32-unknown-unknown/release/lending.wasm \
  --source-account <YOUR_ACCOUNT> \
  --network testnet
```

#### Deploy Work Profile Contract
```bash
cd contracts/work-profile
stellar contract deploy \
  --wasm target/wasm32-unknown-unknown/release/work_profile.wasm \
  --source-account <YOUR_ACCOUNT> \
  --network testnet
```

### 4. Configure Contract Addresses

Update `frontend/src/lib/contracts.ts` with deployed contract addresses:

```typescript
export const CONTRACT_ADDRESSES = {
  SALARY_STREAMING: 'YOUR_DEPLOYED_CONTRACT_ADDRESS',
  LENDING: 'YOUR_LENDING_CONTRACT_ADDRESS',
  WORK_PROFILE: 'YOUR_WORK_PROFILE_CONTRACT_ADDRESS',
};
```

## ⚙️ Configuration

### Network Configuration

Edit `frontend/src/lib/contracts.ts`:

```typescript
export const NETWORK_CONFIG = {
  environment: 'testnet', // or 'mainnet'
  rpcUrl: 'https://soroban-testnet.stellar.org',
  networkPassphrase: 'Test SDF Network ; September 2015',
  horizonUrl: 'https://horizon-testnet.stellar.org',
};
```

### Admin Configuration

Set the admin address in your environment or contract configuration:
```typescript
const ADMIN_ADDRESS = 'GALDPLQ62RAX3V7RJE73D3C2F4SKHGCJ3MIYJ4MLU2EAIUXBDSUVS7SA';
```

## 💻 Usage

### 1. Start the Development Server
```bash
cd frontend
npm run dev
```

### 2. Connect Your Wallet
1. Open http://localhost:3000
2. Click "Request Access" to connect Freighter
3. Approve the connection in Freighter popup

### 3. Stream Management

#### For Admins (Stream Creation)
- Only the designated admin address can create streams
- Fill in employee address, amount (XLM), and duration (days)
- Submit transaction through Freighter

#### For Employees (Withdrawals)
- View your active, paused, and inactive streams
- See real-time available balance
- Withdraw partial or full amounts
- All withdrawal controls are hidden for admin accounts

#### For Employers (Stream Control)
- Pause/resume active streams
- End streams permanently
- Monitor stream progress and withdrawals

### 4. Stream States

- **🟢 Active**: Currently earning, funds available for withdrawal
- **🟡 Paused**: Temporarily stopped, no new earnings
- **🔴 Inactive**: Permanently ended, no further earnings

## 🔧 Smart Contracts

### Salary Streaming Contract

#### Key Functions
```rust
// Create a new salary stream
create_stream(employer: Address, employee: Address, total_amount: i128, duration_seconds: u64)

// Withdraw available funds
withdraw(stream_id: u32, amount: i128) -> Result<(), ContractError>

// Calculate available balance
calculate_available(stream_id: u32) -> i128

// Stream management
pause_stream(stream_id: u32) -> Result<(), ContractError>
resume_stream(stream_id: u32) -> Result<(), ContractError>
end_stream(stream_id: u32) -> Result<(), ContractError>

// Query functions
get_stream(stream_id: u32) -> Stream
get_all_streams() -> Vec<Stream>
get_employee_streams(employee: Address) -> Vec<u32>
get_employer_streams(employer: Address) -> Vec<u32>
```

#### Stream Structure
```rust
pub struct Stream {
    pub id: u32,
    pub employer: Address,
    pub employee: Address,
    pub total_amount: i128,
    pub rate_per_second: i128,
    pub start_time: u64,
    pub duration_seconds: u64,
    pub withdrawn_amount: i128,
    pub is_active: bool,
    pub is_paused: bool,
}
```

### Lending Contract

#### Key Functions
```rust
// Request a loan against salary stream
request_loan(stream_id: u32, amount: i128) -> Result<u32, ContractError>

// Repay loan
repay_loan(loan_id: u32, amount: i128) -> Result<(), ContractError>

// Calculate maximum loan amount
calculate_max_loan(stream_id: u32) -> i128

// Query functions
get_loan_details(loan_id: u32) -> Loan
get_outstanding_loans(borrower: Address) -> Vec<u32>
```

### Work Profile Contract

#### Key Functions
```rust
// Add work experience
add_work_experience(title: String, company: String, start_date: u64, end_date: u64)

// Get work profile
get_work_profile(profile_owner: Address) -> WorkProfile
```

## 🎨 Frontend Structure

```
frontend/
├── src/
│   ├── app/                    # Next.js 14 app directory
│   │   ├── layout.tsx         # Root layout
│   │   ├── page.tsx           # Home page
│   │   └── dashboard/         # Dashboard pages
│   ├── components/            # React components
│   │   ├── stream/           # Streaming-related components
│   │   │   └── StreamSection.tsx
│   │   ├── lending/          # Lending components
│   │   ├── profile/          # Profile components
│   │   └── wallet/           # Wallet components
│   ├── lib/                  # Utility libraries
│   │   ├── stellar-working.ts # Stellar/Soroban integration
│   │   └── contracts.ts      # Contract addresses and config
│   └── types/                # TypeScript type definitions
├── public/                   # Static assets
└── package.json
```

### Key Components

#### StreamSection.tsx
- Main component for salary streaming functionality
- Handles stream creation, withdrawal, and management
- Real-time balance calculations
- Freighter wallet integration

#### Stellar Integration (stellar-working.ts)
- Contract interaction methods
- Transaction building and signing
- Error handling and user feedback
- Network configuration

## 📚 API Reference

### Salary Streaming Methods

```typescript
// Create a new stream (admin only)
salaryStreamingMethods.createStream(
  employer: string,
  employee: string, 
  totalAmount: number,
  durationSeconds: number
)

// Withdraw funds (employee only)
salaryStreamingMethods.withdraw(
  streamId: number,
  amount: number,
  publicKey: string
)

// Get available balance
salaryStreamingMethods.getAvailableBalance(streamId: number)

// Stream management (employer only)
salaryStreamingMethods.pauseStream(streamId: number, publicKey: string)
salaryStreamingMethods.resumeStream(streamId: number, publicKey: string)
salaryStreamingMethods.endStream(streamId: number, publicKey: string)

// Query methods
salaryStreamingMethods.getAllStreams()
salaryStreamingMethods.getStream(streamId: number)
salaryStreamingMethods.getEmployeeStreams(employee: string)
salaryStreamingMethods.getEmployerStreams(employer: string)
```

### Transaction Flow

1. **Build Transaction**: Create XDR with contract call
2. **Simulate**: Validate transaction before signing
3. **Sign**: Use Freighter wallet for signatures
4. **Submit**: Send to Stellar network
5. **Confirm**: Wait for network confirmation

## 🔒 Security

### Access Control
- **Admin Only**: Stream creation restricted to designated admin address
- **Employee Only**: Withdrawals restricted to stream employee
- **Employer Only**: Stream management (pause/resume/end) restricted to employer

### Wallet Security
- All transactions require Freighter wallet approval
- Private keys never exposed to frontend
- Network validation for all operations

### Smart Contract Security
- Input validation on all parameters
- Overflow protection for arithmetic operations
- State consistency checks
- Authorization validation for all state changes

### Best Practices
1. Always verify transaction details in Freighter before signing
2. Use testnet for development and testing
3. Keep Freighter wallet updated
4. Verify contract addresses before interacting

## 🔧 Development

### Running Tests
```bash
# Smart contract tests
cd contracts/salary-streaming
cargo test

# Frontend tests
cd frontend
npm test
```

### Development Commands
```bash
# Start frontend development server
npm run dev

# Build for production
npm run build

# Deploy smart contracts
stellar contract deploy --wasm <contract.wasm> --source-account <account>

# Invoke contract methods
stellar contract invoke --id <contract-id> --fn <method> --arg <value>
```

### Environment Variables
Create a `.env.local` file in the frontend directory:
```
NEXT_PUBLIC_NETWORK=testnet
NEXT_PUBLIC_ADMIN_ADDRESS=GALDPLQ62RAX3V7RJE73D3C2F4SKHGCJ3MIYJ4MLU2EAIUXBDSUVS7SA
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow TypeScript best practices
- Write comprehensive tests
- Update documentation for new features
- Ensure security best practices
- Test on Stellar testnet before mainnet

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Stellar Development Foundation](https://stellar.org/)
- [Soroban Smart Contracts Platform](https://soroban.stellar.org/)
- [Freighter Wallet](https://freighter.app/)
- [Next.js Framework](https://nextjs.org/)

## 📞 Support

For support and questions:
- Create an issue in this repository
- Join the [Stellar Discord](https://discord.gg/stellardev)
- Check [Stellar Documentation](https://developers.stellar.org/)

---

**Built with ❤️ on Stellar**
