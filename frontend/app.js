// ==========================================
// DEPLOYED CONTRACT ID
// ==========================================
const CONTRACT_ID = "CBSPXW47FS2UPXOGAUNJU2U6KXPWS6JT45OEXH6UGV65HDZOK";
const NATIVE_ASSET_ID = "CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC"; // Testnet XLM
const NETWORK_PASSPHRASE = "Test SDF Network ; September 2015";

let StellarSdk = null;
let FreighterApi = null;
let horizonServer = null;
let sorobanServer = null;
let userAddress = null;
let sdkLoaded = false;

// DOM Elements
const connectBtn = document.getElementById('connect-wallet-btn');
const tabStudent = document.getElementById('tab-student');
const tabTeacher = document.getElementById('tab-teacher');
const viewStudent = document.getElementById('student-view');
const viewTeacher = document.getElementById('teacher-view');
const studentBalanceEl = document.getElementById('student-balance');
const rewardHistoryEl = document.getElementById('reward-history');
const rewardForm = document.getElementById('reward-form');
const teacherStatusEl = document.getElementById('teacher-status');
const sendRewardBtn = document.getElementById('send-reward-btn');

// ==========================================
// VIEW TOGGLING (no SDK dependency)
// ==========================================
function switchView(view) {
    if (view === 'student') {
        tabStudent.classList.add('active');
        tabTeacher.classList.remove('active');
        viewStudent.classList.add('active');
        viewTeacher.classList.remove('active');
        viewStudent.classList.remove('hidden');
        viewTeacher.classList.add('hidden');
        if (userAddress && sdkLoaded) fetchStudentData(userAddress);
    } else {
        tabTeacher.classList.add('active');
        tabStudent.classList.remove('active');
        viewTeacher.classList.add('active');
        viewStudent.classList.remove('active');
        viewTeacher.classList.remove('hidden');
        viewStudent.classList.add('hidden');
    }
}

tabStudent.addEventListener('click', () => switchView('student'));
tabTeacher.addEventListener('click', () => switchView('teacher'));
console.log('[StudentRewards] Tab listeners attached.');

const shortenAddress = (addr) => `${addr.slice(0, 5)}...${addr.slice(-4)}`;

// ==========================================
// LOAD SDK LAZILY
// ==========================================
async function loadSDK() {
    if (sdkLoaded) return true;
    try {
        console.log('[StudentRewards] Loading Stellar SDK from esm.sh...');
        const [sdk, freighter] = await Promise.all([
            import('https://esm.sh/@stellar/stellar-sdk'),
            import('https://esm.sh/@stellar/freighter-api')
        ]);
        StellarSdk = sdk;
        FreighterApi = freighter;

        horizonServer = new StellarSdk.Horizon.Server("https://horizon-testnet.stellar.org");
        sorobanServer = new StellarSdk.rpc.Server("https://soroban-testnet.stellar.org");
        sdkLoaded = true;
        console.log('[StudentRewards] SDK loaded successfully!');
        return true;
    } catch (e) {
        console.error('[StudentRewards] Failed to load SDK:', e);
        alert('Failed to load Stellar SDK. Check your internet connection and try again.');
        return false;
    }
}

// ==========================================
// WALLET CONNECTION
// ==========================================
connectBtn.addEventListener('click', async () => {
    try {
        connectBtn.textContent = 'Loading SDK...';
        const loaded = await loadSDK();
        if (!loaded) {
            connectBtn.textContent = 'Connect Freighter';
            return;
        }

        connectBtn.textContent = 'Connecting...';
        const connected = await FreighterApi.isConnected();
        if (!connected) {
            alert('Install the Freighter wallet extension first.');
            connectBtn.textContent = 'Connect Freighter';
            return;
        }

        let accessResult = await FreighterApi.requestAccess();
        userAddress = typeof accessResult === 'string' ? accessResult : accessResult.address || accessResult.publicKey;

        connectBtn.textContent = shortenAddress(userAddress);
        connectBtn.classList.remove('primary');
        if (tabStudent.classList.contains('active')) fetchStudentData(userAddress);

    } catch (e) {
        console.error(e);
        connectBtn.textContent = 'Connect Freighter';
    }
});
console.log('[StudentRewards] Wallet listener attached.');

// ==========================================
// STUDENT VIEW LOGIC
// ==========================================
async function fetchStudentData(address) {
    studentBalanceEl.textContent = '...';
    rewardHistoryEl.innerHTML = '<p class="empty-state">Loading Soroban events...</p>';

    try {
        // Fetch Balance via Horizon
        const account = await horizonServer.loadAccount(address);
        const nativeBalance = account.balances.find(b => b.asset_type === 'native');
        studentBalanceEl.textContent = nativeBalance ? parseFloat(nativeBalance.balance).toFixed(2) : '0.00';

        // Fetch Soroban Events
        const eventsReq = await sorobanServer.getEvents({
            startLedger: (await sorobanServer.getLatestLedger()).sequence - 10000,
            filters: [
                {
                    type: "contract",
                    contractIds: [CONTRACT_ID]
                }
            ],
            limit: 50
        });

        const records = eventsReq.events || [];

        if (records.length === 0) {
            rewardHistoryEl.innerHTML = '<p class="empty-state">No on-chain reward events found.</p>';
            return;
        }

        rewardHistoryEl.innerHTML = '';
        records.forEach(event => {
            let reason = "Decoded Soroban Event";
            const date = new Date(event.ledgerClosedAt).toLocaleDateString();

            const item = document.createElement('div');
            item.className = 'reward-item';
            item.innerHTML = `
                <div class="reward-info">
                    <span class="reward-memo">${escapeHtml(reason)}</span>
                    <span class="reward-date">${date}</span>
                </div>
                <div class="reward-amount-received">Smart Contract Reward</div>
            `;
            rewardHistoryEl.appendChild(item);
        });

    } catch (e) {
        if (e.response && e.response.status === 404) {
            studentBalanceEl.textContent = '0.00';
            rewardHistoryEl.innerHTML = '<p class="empty-state">Account needs funding.</p>';
        } else {
            console.error(e);
            rewardHistoryEl.innerHTML = '<p class="empty-state">Error loading history.</p>';
        }
    }
}

// ==========================================
// TEACHER VIEW LOGIC - Invoke Soroban Contract
// ==========================================
rewardForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!userAddress) return setStatus('Please connect wallet first.', 'error');

    const loaded = await loadSDK();
    if (!loaded) return setStatus('SDK not loaded.', 'error');

    const recipient = document.getElementById('student-address').value.trim();
    const amountStr = document.getElementById('reward-amount').value.trim();
    const memo = document.getElementById('reward-memo').value.trim();

    try {
        sendRewardBtn.disabled = true;
        setStatus('Preparing Soroban Invocation...', 'loading');

        const sourceAccount = await horizonServer.loadAccount(userAddress);

        // Define Contract
        const contract = new StellarSdk.Contract(CONTRACT_ID);

        // Build the Arguments for `send_reward`
        const args = [
            StellarSdk.nativeToScVal(NATIVE_ASSET_ID, { type: "address" }),
            StellarSdk.nativeToScVal(userAddress, { type: "address" }),
            StellarSdk.nativeToScVal(recipient, { type: "address" }),
            StellarSdk.nativeToScVal(parseInt(parseFloat(amountStr) * 10000000), { type: "i128" }),
            StellarSdk.nativeToScVal(memo, { type: "string" })
        ];

        let txBuilder = new StellarSdk.TransactionBuilder(sourceAccount, {
            fee: StellarSdk.BASE_FEE,
            networkPassphrase: NETWORK_PASSPHRASE
        });

        txBuilder.addOperation(contract.call('send_reward', ...args));
        txBuilder.setTimeout(30);
        let tx = txBuilder.build();

        // Simulate Transaction (Required for Soroban)
        setStatus('Simulating transaction...', 'loading');
        const simulation = await sorobanServer.simulateTransaction(tx);

        if (simulation.error) {
            throw new Error('Simulation failed: ' + simulation.error);
        }

        // Assemble the transaction with simulated data
        tx = StellarSdk.SorobanRpc.assembleTransaction(tx, simulation).build();

        setStatus('Awaiting signature...', 'loading');
        const signedXdr = await FreighterApi.signTransaction(tx.toXDR(), { network: 'TESTNET', networkPassphrase: NETWORK_PASSPHRASE });

        setStatus('Submitting to Soroban...', 'loading');
        const signedTx = StellarSdk.TransactionBuilder.fromXDR(signedXdr, NETWORK_PASSPHRASE);
        const submitRes = await sorobanServer.sendTransaction(signedTx);

        if (submitRes.status === 'ERROR') {
            throw new Error('Transaction submission failed');
        }

        setStatus('Reward successfully submitted to Smart Contract!', 'success');
        rewardForm.reset();

    } catch (e) {
        console.error(e);
        setStatus('Error: ' + e.message, 'error');
    } finally {
        sendRewardBtn.disabled = false;
    }
});
console.log('[StudentRewards] Form listener attached.');

function setStatus(msg, type) {
    teacherStatusEl.textContent = msg;
    teacherStatusEl.className = `status-msg ${type}`;
}

function escapeHtml(unsafe) {
    return unsafe.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

console.log('[StudentRewards] App initialized. Buttons are ready!');
