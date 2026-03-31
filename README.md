# Mini Student Reward 🎓

A fully functional, decentralized Web3 application built on the Stellar Soroban blockchain. This dApp allows teachers to securely reward students with native XLM, featuring a modern Next.js frontend and an optimized Rust smart contract.

## Deployment Details

*   **Contract ID:** `CAEY5RTYOVOZDXGIIXNITX5IGJ5RGWWQSYL7GXAQLTDXXHYKBUXLBRMUM`
*   **Alias:** `mini_reward`
*   **Network:** Stellar Testnet

## Dashboard Preview

![Dashboard Screenshot](./dashboard.png)

## Features ✨

*   **Non-Custodial Wallet Integration:** Securely connect and sign transactions using the [Freighter Browser Extension](https://www.freighter.app/).
*   **On-Chain Rewards:** The smart contract allows authorized teachers to transfer tokens to students seamlessly.
*   **Real-time Ledger Interaction:** View account balances and interact with the deployed contract in real time.
*   **Storage Optimized:** Utilizes Soroban's state management to securely store configuration.
*   **Modern Frontend:** Built with Next.js and React for a fast, component-based UI.

## Project Architecture 🏗️

The project is divided into two main components:

1.  **Smart Contract (`/contracts/mini_reward`)**: Written in Rust using the Soroban SDK (v25). It handles the core logic and token transfers.
2.  **Frontend (`/frontend`)**: A Next.js application that interfaces with the deployed contract on the Soroban Testnet via `@stellar/stellar-sdk` and `@stellar/freighter-api`.

---

## Getting Started 🚀

### Prerequisites

*   [Node.js](https://nodejs.org/) (v18+)
*   [Rust](https://www.rust-lang.org/) (v1.94+)
*   [Stellar CLI](https://developers.stellar.org/docs/build/smart-contracts/getting-started/setup)
*   [Freighter Wallet Extension](https://www.freighter.app/)

### 1. Smart Contract

The contract is already deployed to the Stellar Testnet. If you wish to interact or deploy it yourself:

1. Build the contract:
   ```bash
   stellar contract build
   ```
2. Run unit tests to verify contract logic:
   ```bash
   cargo test
   ```

### 2. Frontend Application

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```
4. Open your browser to `http://localhost:3000`.

### Connecting your Wallet

1. Install the Freighter extension.
2. Switch the Freighter network to **Testnet**.
3. Fund your Freighter wallet using the [Stellar Laboratory Friendbot](https://laboratory.stellar.org/#account-creator?network=test).
4. Click **Connect Freighter** in the top right corner of the dApp.
