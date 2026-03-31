"use client";

import { useEffect, useState } from "react";
import { fetchStudentBalance, fetchRewardEvents } from "@/lib/stellar";

function escapeHtml(unsafe) {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export default function StudentView({ walletAddress, contractId }) {
  const [balance, setBalance] = useState("0.00");
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!walletAddress) return;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [bal, evts] = await Promise.all([
          fetchStudentBalance(walletAddress),
          fetchRewardEvents(contractId),
        ]);
        setBalance(bal);
        setEvents(evts);
      } catch (e) {
        if (e.response && e.response.status === 404) {
          setBalance("0.00");
          setError("Account needs funding.");
        } else {
          console.error(e);
          setError("Error loading data.");
        }
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [walletAddress, contractId]);

  return (
    <section className="fade-in">
      {/* Balance Card */}
      <div className="card balance-card">
        <h2>Your Rewards Balance</h2>
        <div className="balance-display">
          <span className="amount">{loading ? "..." : balance}</span>
          <span className="currency">XLM</span>
        </div>
      </div>

      {/* Reward History */}
      <div className="card">
        <h3>Reward History</h3>
        <div id="reward-history">
          {!walletAddress && (
            <p className="empty-state">Connect wallet to view history...</p>
          )}
          {walletAddress && loading && (
            <p className="empty-state">Loading Soroban events...</p>
          )}
          {walletAddress && !loading && error && (
            <p className="empty-state">{error}</p>
          )}
          {walletAddress && !loading && !error && events.length === 0 && (
            <p className="empty-state">No on-chain reward events found.</p>
          )}
          {events.map((event, i) => (
            <div className="reward-item" key={i}>
              <div className="reward-info">
                <span className="reward-memo">
                  {escapeHtml("Decoded Soroban Event")}
                </span>
                <span className="reward-date">
                  {new Date(event.ledgerClosedAt).toLocaleDateString()}
                </span>
              </div>
              <div className="reward-amount-received">Smart Contract Reward</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
