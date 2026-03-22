import time
import json
import requests
from stellar_sdk import Keypair, Network, TransactionBuilder
from stellar_sdk.soroban_server import SorobanServer
import urllib3
urllib3.disable_warnings()

kp = Keypair.random()

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

sim1 = rpc.simulate_transaction(tx1)

out_data = {
    "error": getattr(sim1, 'error', None),
    "events": sim1.events if hasattr(sim1, 'events') else None,
    "results": [r.model_dump() if hasattr(r, 'model_dump') else str(r) for r in sim1.results] if hasattr(sim1, 'results') and sim1.results else None
}

with open("sim_out.json", "w") as f:
    json.dump(out_data, f, indent=2)

print("Saved sim_out.json")
