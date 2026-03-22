import time
import hashlib
from stellar_sdk import Keypair, Network, TransactionBuilder
from stellar_sdk.soroban_server import SorobanServer
import requests
import urllib3
urllib3.disable_warnings()

kp = Keypair.random()
print(f"Deployer account: {kp.public_key}")

# Try funding via friendbot
try:
    res = requests.get(f"https://friendbot.stellar.org/?addr={kp.public_key}", verify=False)
    print("Friendbot status:", res.status_code)
except Exception as e:
    print("Friendbot error:", e)

# Wait a moment for network
time.sleep(5)

rpc = SorobanServer("https://soroban-testnet.stellar.org:443")
account = rpc.load_account(kp.public_key)

with open("target/wasm32-unknown-unknown/release/soroban_mini_reward_contract.wasm", "rb") as f:
    wasm_bytes = f.read()

tx1 = TransactionBuilder(account, Network.TESTNET_NETWORK_PASSPHRASE, base_fee=100000) \
    .append_upload_contract_wasm_op(wasm_bytes) \
    .set_timeout(30) \
    .build()

print("Simulating...")
sim1 = rpc.simulate_transaction(tx1)

if not sim1 or getattr(sim1, 'error', None):
    print(f"Simulation failed!")
    print(f"Error: {getattr(sim1, 'error', 'No error attribute')}")
    print(f"Events: {getattr(sim1, 'events', 'No events')}")
    print(f"Results: {getattr(sim1, 'results', 'No results')}")
else:
    print("Simulation succeeded!")
