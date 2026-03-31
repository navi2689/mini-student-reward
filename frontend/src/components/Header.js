"use client";

import { shortenAddress } from "@/lib/stellar";

export default function Header({
  walletAddress,
  onConnect,
  onDemoConnect,
  connecting,
  contractId,
  onContractIdChange,
}) {
  return (
    <header className="header">
      <div className="logo">
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
        </svg>
        <h1>StudentRewards</h1>
      </div>
      <div className="wallet-controls">
        <div className="header-input-wrapper">
          <span className="header-input-label">Contract:</span>
          <input
            type="text"
            className="header-input"
            placeholder="Contract ID (C...)"
            value={contractId}
            onChange={(e) => onContractIdChange(e.target.value)}
          />
        </div>
        <span className="badge">Testnet</span>
        {!walletAddress && (
          <button
            className="btn"
            onClick={onDemoConnect}
            disabled={connecting}
            style={{ border: "1px solid var(--border-color)", padding: "0.5rem 1rem" }}
          >
            Demo Mode
          </button>
        )}
        <button
          id="connect-wallet-btn"
          className={`btn ${walletAddress ? "" : "primary"}`}
          onClick={onConnect}
          disabled={connecting}
        >
          {connecting
            ? "Connecting..."
            : walletAddress
            ? shortenAddress(walletAddress)
            : "Connect Freighter"}
        </button>
      </div>
    </header>
  );
}
