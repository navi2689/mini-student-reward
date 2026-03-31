const StellarSdk = require('@stellar/stellar-sdk');
const keypair = StellarSdk.Keypair.random();
console.log('Public Key:', keypair.publicKey());
console.log('Secret Key:', keypair.secret());
