"use client";

import { useState, useEffect } from "react";
import Header from "@/components/Header";
import StudentView from "@/components/StudentView";
import TeacherView from "@/components/TeacherView";
import { connectWallet } from "@/lib/stellar";

export default function Home() {
  const [activeTab, setActiveTab] = useState("student");
  const [walletAddress, setWalletAddress] = useState(null);
  const [connecting, setConnecting] = useState(false);
  const [contractId, setContractId] = useState("");

  // Initialize contract ID from localStorage or Env
  useEffect(() => {
    const savedId = localStorage.getItem("soroban_contract_id");
    if (savedId) {
      setContractId(savedId);
    } else {
      setContractId(process.env.NEXT_PUBLIC_CONTRACT_ID || "");
    }
  }, []);

  function handleContractIdChange(newId) {
    setContractId(newId);
    localStorage.setItem("soroban_contract_id", newId);
  }

  function handleDemoConnect() {
    // Inject the previously generated testnet address for quick check
    setWalletAddress("GBN3K7LAJ33ZB7N5BBHIMHBYAAN3ECFV5CLU34SOE7FUWZVUP4S3C5QJ");
  }

  async function handleConnect() {
    try {
      setConnecting(true);
      const address = await connectWallet();
      setWalletAddress(address);
    } catch (e) {
      alert(e.message);
    } finally {
      setConnecting(false);
    }
  }

  return (
    <div className="app-container">
      <Header
        walletAddress={walletAddress}
        onConnect={handleConnect}
        onDemoConnect={handleDemoConnect}
        connecting={connecting}
        contractId={contractId}
        onContractIdChange={handleContractIdChange}
      />

      <main>
        {/* Tab Toggle */}
        <div className="view-toggle">
          <button
            id="tab-student"
            className={`tab ${activeTab === "student" ? "active" : ""}`}
            onClick={() => setActiveTab("student")}
          >
            Student View
          </button>
          <button
            id="tab-teacher"
            className={`tab ${activeTab === "teacher" ? "active" : ""}`}
            onClick={() => setActiveTab("teacher")}
          >
            Teacher View
          </button>
        </div>

        {/* Active View */}
        {activeTab === "student" ? (
          <StudentView walletAddress={walletAddress} contractId={contractId} />
        ) : (
          <TeacherView walletAddress={walletAddress} contractId={contractId} />
        )}
      </main>
    </div>
  );
}
