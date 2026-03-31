"use client";

import * as StellarSdk from "@stellar/stellar-sdk";
import { isConnected, requestAccess, signTransaction } from "@stellar/freighter-api";

// ── Config ──────────────────────────────────────────────
const CONTRACT_ID =
  process.env.NEXT_PUBLIC_CONTRACT_ID ||
  "CAEY5RTYOVOZDXGIIXNITX5IGJ5RGWWQSYL7GXAQLTDXXHYKBUXLBRMUM";

const NATIVE_ASSET_ID =
  process.env.NEXT_PUBLIC_NATIVE_TOKEN_ID ||
  "CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC";

const NETWORK_PASSPHRASE = "Test SDF Network ; September 2015";

const RPC_URL =
  process.env.NEXT_PUBLIC_RPC_URL || "https://soroban-testnet.stellar.org";

const HORIZON_URL =
  process.env.NEXT_PUBLIC_HORIZON_URL ||
  "https://horizon-testnet.stellar.org";

// ── Servers ─────────────────────────────────────────────
let horizonServer = null;
let sorobanServer = null;

function getHorizonServer() {
  if (!horizonServer) {
    horizonServer = new StellarSdk.Horizon.Server(HORIZON_URL);
  }
  return horizonServer;
}

function getSorobanServer() {
  if (!sorobanServer) {
    sorobanServer = new StellarSdk.rpc.Server(RPC_URL);
  }
  return sorobanServer;
}

// ── Helpers ─────────────────────────────────────────────
export function shortenAddress(addr) {
  if (!addr) return "";
  return `${addr.slice(0, 5)}...${addr.slice(-4)}`;
}

// ── Wallet Connection ───────────────────────────────────
export async function connectWallet() {
  console.log("Connecting to Freighter...");
  
  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => reject(new Error("Connection timed out. Please make sure Freighter is unlocked and available.")), 15000);
  });

  try {
    const connectionTask = (async () => {
      const connectedResult = await isConnected();
      console.log("Freighter isConnected result:", connectedResult);
      
      if (!connectedResult || !connectedResult.isConnected) {
        throw new Error("Freighter wallet extension not found or locked. Please install and unlock it.");
      }

      console.log("Requesting access...");
      const accessResult = await requestAccess();
      console.log("Access result:", accessResult);

      if (accessResult.error) {
        throw new Error(accessResult.error);
      }

      const address = accessResult.address;

      if (!address) {
        throw new Error("No address returned from Freighter.");
      }

      return address;
    })();

    return await Promise.race([connectionTask, timeoutPromise]);
  } catch (err) {
    console.error("Connection error:", err);
    throw err;
  }
}

// ── Fetch Student Data ──────────────────────────────────
export async function fetchStudentBalance(address) {
  const horizon = getHorizonServer();
  const account = await horizon.loadAccount(address);
  const nativeBalance = account.balances.find(
    (b) => b.asset_type === "native"
  );
  return nativeBalance ? parseFloat(nativeBalance.balance).toFixed(2) : "0.00";
}

// ── Fetch Reward Events ──────────────────────────────────
export async function fetchRewardEvents(contractIdOverride) {
  const soroban = getSorobanServer();
  const latestLedger = await soroban.getLatestLedger();
  const targetContractId = contractIdOverride || CONTRACT_ID;

  const eventsReq = await soroban.getEvents({
    startLedger: latestLedger.sequence - 10000,
    filters: [
      {
        type: "contract",
        contractIds: [targetContractId],
      },
    ],
    limit: 50,
  });

  return eventsReq.events || [];
}

// ── Send Reward (Teacher) ───────────────────────────────
export async function sendReward(
  senderAddress,
  recipientAddress,
  amountXlm,
  memo,
  onStatus,
  contractIdOverride
) {
  const horizon = getHorizonServer();
  const soroban = getSorobanServer();
  const targetContractId = contractIdOverride || CONTRACT_ID;

  onStatus?.("Preparing Soroban Invocation...", "loading");

  const sourceAccount = await horizon.loadAccount(senderAddress);
  const contract = new StellarSdk.Contract(targetContractId);

  const args = [
    StellarSdk.nativeToScVal(NATIVE_ASSET_ID, { type: "address" }),
    StellarSdk.nativeToScVal(senderAddress, { type: "address" }),
    StellarSdk.nativeToScVal(recipientAddress, { type: "address" }),
    StellarSdk.nativeToScVal(
      parseInt(parseFloat(amountXlm) * 10000000),
      { type: "i128" }
    ),
    StellarSdk.nativeToScVal(memo, { type: "string" }),
  ];

  let txBuilder = new StellarSdk.TransactionBuilder(sourceAccount, {
    fee: StellarSdk.BASE_FEE,
    networkPassphrase: NETWORK_PASSPHRASE,
  });

  txBuilder.addOperation(contract.call("send_reward", ...args));
  txBuilder.setTimeout(30);
  let tx = txBuilder.build();

  // Simulate
  onStatus?.("Simulating transaction...", "loading");
  const simulation = await soroban.simulateTransaction(tx);

  if (simulation.error) {
    throw new Error("Simulation failed: " + simulation.error);
  }

  // Assemble
  tx = StellarSdk.SorobanRpc.assembleTransaction(tx, simulation).build();

  // Sign
  onStatus?.("Awaiting signature...", "loading");
  const signedXdr = await signTransaction(tx.toXDR(), {
    network: "TESTNET",
    networkPassphrase: NETWORK_PASSPHRASE,
  });

  // Submit
  onStatus?.("Submitting to Soroban...", "loading");
  const signedTx = StellarSdk.TransactionBuilder.fromXDR(
    signedXdr,
    NETWORK_PASSPHRASE
  );
  const submitRes = await soroban.sendTransaction(signedTx);

  if (submitRes.status === "ERROR") {
    throw new Error("Transaction submission failed");
  }

  return submitRes;
}
