import time
import re
from stellar_sdk import Keypair, Network, TransactionBuilder
from stellar_sdk.soroban_server import SorobanServer
import requests
import urllib3
import json
urllib3.disable_warnings()

kp = Keypair.random()

# Try funding via friendbot
try:
    requests.get(f"https://friendbot.stellar.org/?addr={kp.public_key}", verify=False)
except Exception as e:
    pass
time.sleep(5)

rpc = SorobanServer("https://soroban-testnet.stellar.org:443")
account = rpc.load_account(kp.public_key)

with open("target/wasm32v1-none/release/soroban_mini_reward_contract.wasm", "rb") as f:
    wasm_bytes = f.read()

tx1 = TransactionBuilder(account, Network.TESTNET_NETWORK_PASSPHRASE, base_fee=100000) \
    .append_upload_contract_wasm_op(wasm_bytes) \
    .set_timeout(30) \
    .build()

sim1 = rpc.simulate_transaction(tx1)
tx1 = rpc.prepare_transaction(tx1, sim1)
tx1.sign(kp)
res1 = rpc.send_transaction(tx1)

while True:
    st1 = rpc.get_transaction(res1.hash)
    if st1.status != "NOT_FOUND":
        break
    time.sleep(2)

import hashlib
wasm_id = hashlib.sha256(wasm_bytes).hexdigest()

account = rpc.load_account(kp.public_key)
tx2 = TransactionBuilder(account, Network.TESTNET_NETWORK_PASSPHRASE, base_fee=100000) \
    .append_create_contract_op(wasm_id=wasm_id, address=kp.public_key) \
    .set_timeout(30) \
    .build()

sim2 = rpc.simulate_transaction(tx2)
tx2 = rpc.prepare_transaction(tx2, sim2)
tx2.sign(kp)
res2 = rpc.send_transaction(tx2)

while True:
    st2 = rpc.get_transaction(res2.hash)
    if st2.status != "NOT_FOUND":
        break
    time.sleep(2)

# Extract from sim2 results
sim2_dict = [r.model_dump() if hasattr(r, 'model_dump') else repr(r) for r in sim2.results]

import re
contract_id = None

# If SDK provides parsed ScVal Address:
for res in sim2_dict:
    # Just serialize everything to a big string and regex match the contract ID pattern
    match = re.search(r"C[A-Z0-9]{55}", str(res))
    if match:
        contract_id = match.group(0)
        break

if not contract_id:
    # Look into st2 resultMetaXdr explicitly if we can
    match = re.search(r"C[A-Z0-9]{55}", str(sim2.results))
    if match: contract_id = match.group(0)

with open("deploy_result.json", "w") as f:
    json.dump({
        "contract_id": contract_id,
        "sim2_res": str(sim2_dict)
    }, f, indent=2)

if contract_id:
    with open("frontend/app.js", "r") as app_f:
        content = app_f.read()
    content = content.replace("PUT_YOUR_DEPLOYED_CONTRACT_ID_HERE", contract_id)
    with open("frontend/app.js", "w") as app_f:
        app_f.write(content)
