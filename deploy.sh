#!/usr/bin/env bash
# ==================================================
# Deploy Script: mini-student-reward Soroban Contract
# ==================================================
set -e

NETWORK="testnet"
SOURCE_ACCOUNT="dev-key"
WASM_PATH="target/wasm32v1-none/release/soroban_mini_reward_contract.wasm"

echo "🔧 Step 1: Add Testnet network config..."
stellar network add "$NETWORK" \
  --rpc-url https://soroban-testnet.stellar.org:443 \
  --network-passphrase "Test SDF Network ; September 2015" 2>/dev/null || echo "  ℹ️  Network already configured."

echo "🔑 Step 2: Generate identity (if needed)..."
stellar keys generate "$SOURCE_ACCOUNT" --network "$NETWORK" 2>/dev/null || echo "  ℹ️  Identity '$SOURCE_ACCOUNT' already exists."

echo "💰 Step 3: Fund account on Testnet via Friendbot..."
stellar keys fund "$SOURCE_ACCOUNT" --network "$NETWORK" || echo "  ℹ️  Account may already be funded."

echo "🛠  Step 4: Build the contract..."
stellar contract build

echo "🚀 Step 5: Deploy contract to Testnet..."
CONTRACT_ID=$(stellar contract deploy \
  --wasm "$WASM_PATH" \
  --source "$SOURCE_ACCOUNT" \
  --network "$NETWORK")

echo ""
echo "============================================"
echo "✅ SUCCESS! Deployed Contract ID:"
echo "   $CONTRACT_ID"
echo "============================================"

# Save contract ID to file
echo "$CONTRACT_ID" > contract_id.txt
echo "📄 Contract ID saved to contract_id.txt"
