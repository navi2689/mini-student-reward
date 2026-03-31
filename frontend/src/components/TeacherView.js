"use client";

import { useState } from "react";
import { sendReward } from "@/lib/stellar";

export default function TeacherView({ walletAddress, contractId }) {
  const [studentAddr, setStudentAddr] = useState("");
  const [amount, setAmount] = useState("");
  const [memo, setMemo] = useState("");
  const [status, setStatus] = useState({ msg: "", type: "" });
  const [submitting, setSubmitting] = useState(false);

  function handleStatus(msg, type) {
    setStatus({ msg, type });
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (!walletAddress) {
      handleStatus("Please connect wallet first.", "error");
      return;
    }

    // Block real transactions if using the Demo Address
    if (walletAddress === "GBN3K7LAJ33ZB7N5BBHIMHBYAAN3ECFV5CLU34SOE7FUWZVUP4S3C5QJ") {
      setSubmitting(true);
      handleStatus("Simulating payload generation...", "loading");
      setTimeout(() => {
        handleStatus(
          "Demo Mode Active: Transactions cannot be sent because a wallet signature is required. Install Freighter to send real XLM.",
          "error"
        );
        setSubmitting(false);
      }, 1500);
      return;
    }

    try {
      setSubmitting(true);
      await sendReward(
        walletAddress,
        studentAddr,
        amount,
        memo,
        handleStatus,
        contractId
      );
      handleStatus(
        "Reward successfully submitted to Smart Contract!",
        "success"
      );
      setStudentAddr("");
      setAmount("");
      setMemo("");
    } catch (err) {
      console.error(err);
      handleStatus("Error: " + err.message, "error");
    } finally {
      if (walletAddress !== "GBN3K7LAJ33ZB7N5BBHIMHBYAAN3ECFV5CLU34SOE7FUWZVUP4S3C5QJ") {
        setSubmitting(false);
      }
    }
  }

  return (
    <section className="fade-in">
      <div className="card">
        <h2>Send Reward</h2>
        <p className="subtitle">Reward a student for their great work!</p>

        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label htmlFor="student-address">Student Stellar Address</label>
            <input
              type="text"
              id="student-address"
              placeholder="G..."
              required
              value={studentAddr}
              onChange={(e) => setStudentAddr(e.target.value)}
            />
          </div>

          <div className="row">
            <div className="input-group">
              <label htmlFor="reward-amount">Amount (XLM)</label>
              <input
                type="number"
                id="reward-amount"
                min="0.1"
                step="0.1"
                placeholder="10.0"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
            <div className="input-group">
              <label htmlFor="reward-memo">Reason (Memo)</label>
              <input
                type="text"
                id="reward-memo"
                maxLength="28"
                placeholder="e.g. Math Homework"
                required
                value={memo}
                onChange={(e) => setMemo(e.target.value)}
              />
            </div>
          </div>

          <button
            type="submit"
            id="send-reward-btn"
            className="btn primary full-width"
            disabled={submitting}
          >
            {submitting ? "Sending..." : "Send Reward"}
          </button>

          {status.msg && (
            <p className={`status-msg ${status.type}`}>{status.msg}</p>
          )}
        </form>
      </div>
    </section>
  );
}
