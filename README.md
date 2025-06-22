# 🚀 Stellar Salary Streaming & Lending Platform

A comprehensive DeFi platform built on Stellar blockchain that enables real-time salary streaming and collateralized lending using active salary streams as collateral.

## 🌟 Features

### 💰 Salary Streaming
- **Real-time Payments**: Stream salaries continuously instead of monthly bulk payments
- **Flexible Withdrawals**: Employees can withdraw earned amounts anytime
- **Employer Controls**: Pause, resume, or end streams as needed
- **Transparent Tracking**: Real-time visualization of earnings and withdrawals
- **Multi-stream Support**: Manage multiple salary streams per employee

### 🏦 Collateralized Lending
- **Stream-backed Loans**: Use active salary streams as collateral
- **Risk-based Tiers**: 5-tier risk assessment system (1-5)
- **Competitive Rates**: 4.0% - 6.0% APR based on risk tier
- **Admin Dashboard**: Comprehensive loan management interface
- **Flexible Repayment**: Partial or full loan repayments
- **Automated Risk Assessment**: AI-powered credit scoring

### 👤 Work Profile Management
- **Experience Tracking**: Years of experience and job stability metrics
- **Risk Assessment**: Automated risk scoring algorithm
- **Sector Classification**: Industry-specific risk evaluation
- **Profile Updates**: Real-time risk tier recalculation
- **Employment History**: Track job changes and stability

## 🏗️ Technical Architecture

### Smart Contracts (Rust/Soroban)
- **Salary Streaming Contract**: `CAACXYESJLBLSO6YI4Q4PBTQGLUOLDWVRBU6OEP3WHSHCQ7ASPZ66J34`
- **Lending Contract**: `CCEM6DMMVFLPJHZIDN5TM3SPQPZKYPBMXE4HN3HFRZILF3MJQ4I76VUR`
- **Work Profile Contract**: `CCAHTMF7PDOB2KM4SIDDHBW2AMVGEWCTLKG3BSYJNTFGMASSGMKO6OKT`

### Frontend Stack
- **Framework**: Next.js 15.3.3 with React 19
- **Styling**: Tailwind CSS 4.0 with responsive design
- **Wallet Integration**: Freighter Wallet API v4.1.0
- **State Management**: React Hooks with TypeScript
- **UI Components**: Lucide React icons
- **Build Tool**: TypeScript 5 with ESLint

### Blockchain Configuration
- **Network**: Stellar Testnet
- **RPC URL**: `https://soroban-testnet.stellar.org:443`
- **Network Passphrase**: `Test SDF Network ; September 2015`
- **Asset**: Native XLM (Stellar Lumens)
- Professional work history on-chain
## 🚀 Getting Started

### Prerequisites
- **Node.js 18+** for frontend development
- **Rust & Cargo** for smart contract development
- **Stellar CLI** for contract deployment
- **Freighter Wallet** browser extension

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd b
```

2. **Install frontend dependencies**
```bash
cd frontend
npm install
```

3. **Install contract dependencies**
```bash
cd contracts
cargo check
```

4. **Environment Setup**
Create `.env.local` in the frontend directory:
```env
NEXT_PUBLIC_ENVIRONMENT=testnet
NEXT_PUBLIC_STELLAR_NETWORK_PASSPHRASE=Test SDF Network ; September 2015
NEXT_PUBLIC_STELLAR_RPC_URL=https://soroban-testnet.stellar.org:443
NEXT_PUBLIC_SALARY_STREAMING_CONTRACT_ID=CAACXYESJLBLSO6YI4Q4PBTQGLUOLDWVRBU6OEP3WHSHCQ7ASPZ66J34
NEXT_PUBLIC_LENDING_CONTRACT_ID=CCEM6DMMVFLPJHZIDN5TM3SPQPZKYPBMXE4HN3HFRZILF3MJQ4I76VUR
NEXT_PUBLIC_WORK_PROFILE_CONTRACT_ID=CCAHTMF7PDOB2KM4SIDDHBW2AMVGEWCTLKG3BSYJNTFGMASSGMKO6OKT
```

### Running the Application

1. **Start the development server**
```bash
cd frontend
npm run dev
```

2. **Access the application**
Open [http://localhost:3000](http://localhost:3000) in your browser

3. **Connect Freighter Wallet**
   - Install Freighter browser extension
   - Create or import a Stellar account
   - Switch to testnet mode
   - Fund your account with test XLM

## 📱 Usage Guide

### For Employers

1. **Create Salary Stream**
   - Navigate to the dashboard
   - Enter employee's Stellar address
   - Set total amount and duration
   - Confirm transaction in Freighter

2. **Manage Streams**
   - Monitor active streams in real-time
   - Pause streams temporarily
   - Resume paused streams
   - End streams permanently

### For Employees

1. **Monitor Earnings**
   - View real-time earnings accumulation
   - Check available withdrawal amounts
   - Track withdrawal history

2. **Withdraw Funds**
   - Partial withdrawals as needed
   - Full withdrawal of available amount
   - Instant settlement on Stellar

3. **Apply for Loans**
   - Use active streams as collateral
   - Complete work profile for better rates
   - Submit loan applications

### For Loan Administrators

1. **Review Applications**
   - Evaluate loan requests
   - Check borrower risk profiles
   - Approve or reject with feedback

2. **Monitor Loans**
   - Track active loans
   - Monitor repayment schedules
   - Manage defaults and collections
## 🏦 Risk Tiers & Interest Rates

| Tier | Risk Level | APR | Description |
|------|------------|-----|-------------|
| 1 | Very Low | 4.0% | Excellent credit, stable employment |
| 2 | Low | 4.5% | Good credit, consistent income |
| 3 | Medium | 5.0% | Average risk profile |
| 4 | High | 5.5% | Higher risk, shorter employment |
| 5 | Very High | 6.0% | Highest risk tier |

## � Smart Contract Functions

### Salary Streaming Contract

```rust
// Create a new salary stream
pub fn create_stream(
    env: Env,
    employer: Address,
    employee: Address,
    total_amount: u64,
    duration_seconds: u64,
) -> Result<u32, ContractError>

// Withdraw from stream
pub fn withdraw(
    env: Env,
    stream_id: u32,
    amount: u64,
    employee: Address,
) -> Result<(), ContractError>

// Pause/resume/end stream (employer only)
pub fn pause_stream(env: Env, stream_id: u32, employer: Address)
pub fn resume_stream(env: Env, stream_id: u32, employer: Address)
pub fn end_stream(env: Env, stream_id: u32, employer: Address)

// Get stream information
pub fn get_stream(env: Env, stream_id: u32) -> Result<Stream, ContractError>
pub fn get_all_streams(env: Env) -> Vec<Stream>
```

### Lending Contract

```rust
// Request a loan using stream as collateral
pub fn request_loan(
    env: Env,
    amount: u64,
    risk_tier: u32,
    collateral_stream_id: u32,
    borrower: Address,
) -> Result<u32, ContractError>

// Approve/reject loan (admin only)
pub fn approve_loan(env: Env, loan_id: u32, admin: Address) -> Result<(), ContractError>
pub fn reject_loan(env: Env, loan_id: u32, admin: Address) -> Result<(), ContractError>

// Repay loan
pub fn repay_loan(
    env: Env,
    loan_id: u32,
    amount: u64,
    borrower: Address,
) -> Result<(), ContractError>

// Get loan information
pub fn get_loan(env: Env, loan_id: u32) -> Result<Loan, ContractError>
pub fn get_all_loans(env: Env) -> Vec<Loan>
pub fn get_borrower_loans(env: Env, borrower: Address) -> Vec<u32>
```

### Work Profile Contract

```rust
// Create or update work profile
pub fn update_profile(
    env: Env,
    user: Address,
    years_experience: u32,
    current_job_duration: u32,
    job_changes: u32,
    sector: String,
) -> Result<(), ContractError>

// Get user profile and risk assessment
pub fn get_profile(env: Env, user: Address) -> Result<WorkProfile, ContractError>
pub fn calculate_risk_score(env: Env, user: Address) -> Result<u32, ContractError>
```
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
