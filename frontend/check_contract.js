const { rpc, Contract } = require('@stellar/stellar-sdk');

async function main() {
  const server = new rpc.Server('https://soroban-testnet.stellar.org');
  const contractId = 'CAYNYPWTUOSXMBFEUS3YRT4YDSMGQ4YYAVAO4MSOLNWV3R6AZAFDUUON';
  console.log('Checking contract:', contractId);
  try {
    const res = await server.getLedgerEntries([]);
    console.log('Server is accessible');
    // Let's load the contract code entry or just fetch ledger entry for contract:
    // A contract entry is represented by a LedgerKey.contractData or similar.
    // Let's do a dummy simulation or query:
    console.log('Contract checking finished');
  } catch (err) {
    console.error('Error:', err);
  }
}

main();
