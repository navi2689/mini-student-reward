import { Keypair, Networks, TransactionBuilder, Contract, SorobanDataBuilder, nativeToScVal, Asset, Operation } from '@stellar/stellar-sdk';
import { rpc, Horizon } from '@stellar/stellar-sdk';
import fs from 'fs';

const server = new rpc.Server("https://soroban-testnet.stellar.org");
const horizon = new Horizon.Server("https://horizon-testnet.stellar.org");

async function fundAccount(publicKey) {
    console.log("Funding account with Friendbot...");
    const res = await fetch(`https://friendbot.stellar.org/?addr=${publicKey}`);
    return await res.json();
}

async function main() {
    const keypair = Keypair.random();
    console.log("Deployer:", keypair.publicKey());
    
    await fundAccount(keypair.publicKey());
    
    const wasmBytes = fs.readFileSync("target/wasm32-unknown-unknown/release/soroban_mini_reward_contract.wasm");
    
    const account = await server.getAccount(keypair.publicKey());
    console.log("Got account sequence");
    
    let tx = new TransactionBuilder(account, { fee: "100000", networkPassphrase: Networks.TESTNET })
        .addOperation(Operation.uploadContractWasm({ wasm: wasmBytes }))
        .setTimeout(30)
        .build();

    console.log("Simulating upload...");
    let sim = await server.simulateTransaction(tx);
    if (sim.error) {
        throw new Error("Simulation error: " + sim.error + "\n" + JSON.stringify(sim, null, 2));
    }
    
    tx = await server.prepareTransaction(tx);
    tx.sign(keypair);
    
    console.log("Submitting upload...");
    let res = await server.sendTransaction(tx);
    
    let status = "PENDING";
    let hash = res.hash;
    let getTxRes;
    while (status === "PENDING" || status === "NOT_FOUND") {
        await new Promise(r => setTimeout(r, 2000));
        getTxRes = await server.getTransaction(hash);
        status = getTxRes.status;
    }
    
    if (status !== "SUCCESS") {
        throw new Error("Upload failed: " + JSON.stringify(getTxRes));
    }
    console.log("Upload Success!");
    
    // get wasm id
    const wasmId = getTxRes.returnValue.value().toString('hex');
    console.log("WASM ID:", wasmId);
    
    // Create Contract
    const account2 = await server.getAccount(keypair.publicKey());
    let tx2 = new TransactionBuilder(account2, { fee: "100000", networkPassphrase: Networks.TESTNET })
        .addOperation(Operation.createCustomContract({
            address: keypair.publicKey(),
            wasmId: Buffer.from(wasmId, 'hex')
        }))
        .setTimeout(30)
        .build();
        
    console.log("Simulating create...");
    let sim2 = await server.simulateTransaction(tx2);
    if (sim2.error) {
        throw new Error("Simulation error 2: " + sim2.error + "\n" + JSON.stringify(sim2, null, 2));
    }
    
    tx2 = await server.prepareTransaction(tx2);
    tx2.sign(keypair);
    
    console.log("Submitting create...");
    let res2 = await server.sendTransaction(tx2);
    status = "PENDING";
    hash = res2.hash;
    while (status === "PENDING" || status === "NOT_FOUND") {
        await new Promise(r => setTimeout(r, 2000));
        getTxRes = await server.getTransaction(hash);
        status = getTxRes.status;
    }
    
    if (status !== "SUCCESS") {
        throw new Error("Create failed: " + JSON.stringify(getTxRes));
    }
    
    const contractId = getTxRes.returnValue.address().toString();
    console.log("\\n============================================");
    console.log("SUCCESS! DEPLOYED CONTRACT ID:");
    console.log("> " + contractId + " <");
    console.log("============================================\\n");
    
    let appJs = fs.readFileSync("frontend/app.js", "utf-8");
    appJs = appJs.replace("PUT_YOUR_DEPLOYED_CONTRACT_ID_HERE", contractId);
    fs.writeFileSync("frontend/app.js", appJs);
    console.log("Updated frontend/app.js");
}

main().catch(console.error);
