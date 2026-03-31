const StellarSdk = require('@stellar/stellar-sdk');
const fs = require('fs');
const keypair = StellarSdk.Keypair.random();
const output = `Public Key: ${keypair.publicKey()}\nSecret Key: ${keypair.secret()}`;
fs.writeFileSync('keys.txt', output);
console.log('Keys generated successfully in keys.txt');
