# 🎓 Mini Student Reward — Stellar Soroban Smart Contract

A Stellar Soroban smart contract that lets **teachers reward students** on-chain using XLM token transfers, with on-chain event logging.

## 📁 Project Structure

```
mini-student-reward/
├── contracts/
│   ├── hello_world/         # Sample hello world contract
│   └── mini_reward/         # Main reward contract
│       └── src/
│           ├── lib.rs        # Contract logic
│           └── test.rs       # Unit tests
├── frontend/
│   ├── index.html            # Frontend UI
│   └── app.js                # Stellar SDK + contract interaction
├── Cargo.toml                # Workspace config
├── deploy.sh                 # 🚀 Automated deploy script (Linux/macOS)
└── .gitignore
```

## ⚙️ Environment Setup

1. **Install Rust**
   ```bash
   curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
   ```

2. **Add WASM target**
   ```bash
   rustup target add wasm32-unknown-unknown
   ```

3. **Install Stellar CLI**
   ```bash
   cargo install --locked stellar-cli --features opt
   ```

## 🛠 Build

```bash
stellar contract build
```
Output: `target/wasm32v1-none/release/soroban_mini_reward_contract.wasm`

## 🌐 Configure Network

```bash
stellar network add testnet \
  --rpc-url https://soroban-testnet.stellar.org:443 \
  --network-passphrase "Test SDF Network ; September 2015"
```

## 🔑 Generate & Fund Identity

```bash
stellar keys generate dev-key --network testnet
stellar keys fund dev-key --network testnet
```

## 🚀 Deploy to Testnet

```bash
stellar contract deploy \
  --wasm target/wasm32v1-none/release/soroban_mini_reward_contract.wasm \
  --source dev-key \
  --network testnet
```

Or use the automated script:

```bash
bash deploy.sh
```

## 🔁 Invoke Contract

```bash
stellar contract invoke \
  --id <CONTRACT_ID> \
  --source dev-key \
  --network testnet \
  -- send_reward \
  --token_address <NATIVE_TOKEN_ID> \
  --teacher <TEACHER_ADDRESS> \
  --student <STUDENT_ADDRESS> \
  --amount 1000000 \
  --reason "Excellent work!"
```

## 🌐 Deployed Contract

| | |
|---|---|
| **Network** | Stellar Testnet |
| **Contract ID** | `CBSPXW47FS2UPXOGAUNJU2U6KXPWS6JT45OEXH6UGV65HDZOK` |
| **Frontend** | Run `python -m http.server 8081` in the `frontend/` folder |

## 🧪 Run Tests

```bash
cargo test
```

## 📜 License

MIT
