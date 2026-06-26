import { Contract, rpc, TransactionBuilder, Networks, Address, nativeToScVal, scValToNative } from '@stellar/stellar-sdk';
import { signTransaction } from '@stellar/freighter-api';

export const CONTRACT_ID = "CBAEJOL2DHNWHV3WDYEIST5C6MS6647UK33CIPBCDO4YEV254QZQ3USO";
export const RPC_URL = "https://soroban-testnet.stellar.org";
export const NATIVE_TOKEN_ID = "CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC";

const server = new rpc.Server(RPC_URL);

// helper to format amount to Soroban i128 (with 7 decimals)
function toSorobanAmount(amount: number): bigint {
  return BigInt(Math.round(amount * 10000000));
}

/**
 * Check if the student is already linked to the parent in the contract
 */
export async function isStudentLinked(parentPublicKey: string, studentPublicKey: string): Promise<boolean> {
  try {
    const contract = new Contract(CONTRACT_ID);
    const sourceAccount = await server.getAccount(parentPublicKey);
    
    const tx = new TransactionBuilder(sourceAccount, {
      fee: "100000",
      networkPassphrase: Networks.TESTNET,
    })
    .addOperation(
      contract.call(
        "get_student_parent",
        new Address(studentPublicKey).toScVal()
      )
    )
    .setTimeout(30)
    .build();

    const simResult = await server.simulateTransaction(tx);
    if (rpc.Api.isSimulationSuccess(simResult)) {
      const resultVal = simResult.result?.retval;
      if (resultVal) {
        const nativeVal = scValToNative(resultVal);
        return nativeVal === parentPublicKey;
      }
    }
  } catch (err) {
    console.error("Error checking link status:", err);
  }
  return false;
}

/**
 * Link a student to a parent and set an allowance
 */
export async function linkStudentInContract(parentPublicKey: string, studentPublicKey: string, allowance: number) {
  const contract = new Contract(CONTRACT_ID);
  const sourceAccount = await server.getAccount(parentPublicKey);
  
  const tx = new TransactionBuilder(sourceAccount, {
    fee: "100000",
    networkPassphrase: Networks.TESTNET,
  })
  .addOperation(
    contract.call(
      "link_student",
      new Address(parentPublicKey).toScVal(),
      new Address(studentPublicKey).toScVal(),
      nativeToScVal(toSorobanAmount(allowance), { type: "i128" })
    )
  )
  .setTimeout(300)
  .build();

  const preparedTx = await server.prepareTransaction(tx);
  const signResult = await signTransaction(preparedTx.toXDR(), {
    networkPassphrase: "Test SDF Network ; September 2015",
  });
  
  if (signResult.error) {
    throw new Error(signResult.error as string);
  }

  const submittedTx = TransactionBuilder.fromXDR(signResult.signedTxXdr, Networks.TESTNET);
  const sendResult = await server.sendTransaction(submittedTx);
  
  if (sendResult.status === "ERROR") {
    throw new Error(`Transaction failed: ${JSON.stringify(sendResult.errorResult)}`);
  }

  let txResult = await server.getTransaction(sendResult.hash);
  while (txResult.status === rpc.Api.GetTransactionStatus.NOT_FOUND) {
    await new Promise((resolve) => setTimeout(resolve, 1500));
    txResult = await server.getTransaction(sendResult.hash);
  }

  if (txResult.status === rpc.Api.GetTransactionStatus.SUCCESS) {
    return {
      hash: sendResult.hash,
      result: txResult
    };
  } else {
    throw new Error(`Transaction failed: ${txResult.status}`);
  }
}

/**
 * Deposit funds for a student. Automatically links if not linked.
 */
export async function depositToContract(parentPublicKey: string, studentPublicKey: string, amount: number) {
  const contract = new Contract(CONTRACT_ID);
  const sourceAccount = await server.getAccount(parentPublicKey);
  
  const txBuilder = new TransactionBuilder(sourceAccount, {
    fee: "100000",
    networkPassphrase: Networks.TESTNET,
  });

  // Check if student is linked. If not, add link operation.
  const linked = await isStudentLinked(parentPublicKey, studentPublicKey);
  if (!linked) {
    txBuilder.addOperation(
      contract.call(
        "link_student",
        new Address(parentPublicKey).toScVal(),
        new Address(studentPublicKey).toScVal(),
        nativeToScVal(toSorobanAmount(100000), { type: "i128" }) // Default generous allowance (e.g. 100k)
      )
    );
  }

  // Add deposit operation
  txBuilder.addOperation(
    contract.call(
      "deposit",
      new Address(parentPublicKey).toScVal(),
      new Address(studentPublicKey).toScVal(),
      nativeToScVal(toSorobanAmount(amount), { type: "i128" })
    )
  );

  const tx = txBuilder.setTimeout(300).build();
  const preparedTx = await server.prepareTransaction(tx);
  const signResult = await signTransaction(preparedTx.toXDR(), {
    networkPassphrase: "Test SDF Network ; September 2015",
  });
  
  if (signResult.error) {
    throw new Error(signResult.error as string);
  }

  const submittedTx = TransactionBuilder.fromXDR(signResult.signedTxXdr, Networks.TESTNET);
  const sendResult = await server.sendTransaction(submittedTx);
  
  if (sendResult.status === "ERROR") {
    throw new Error(`Transaction failed: ${JSON.stringify(sendResult.errorResult)}`);
  }

  let txResult = await server.getTransaction(sendResult.hash);
  while (txResult.status === rpc.Api.GetTransactionStatus.NOT_FOUND) {
    await new Promise((resolve) => setTimeout(resolve, 1500));
    txResult = await server.getTransaction(sendResult.hash);
  }

  if (txResult.status === rpc.Api.GetTransactionStatus.SUCCESS) {
    return {
      hash: sendResult.hash,
      result: txResult
    };
  } else {
    throw new Error(`Transaction failed: ${txResult.status}`);
  }
}

/**
 * Pay university tuition
 */
export async function payUniversityFromContract(studentPublicKey: string, universityPublicKey: string, amount: number) {
  const contract = new Contract(CONTRACT_ID);
  const sourceAccount = await server.getAccount(studentPublicKey);
  
  const tx = new TransactionBuilder(sourceAccount, {
    fee: "100000",
    networkPassphrase: Networks.TESTNET,
  })
  .addOperation(
    contract.call(
      "pay_university",
      new Address(studentPublicKey).toScVal(),
      new Address(universityPublicKey).toScVal(),
      nativeToScVal(toSorobanAmount(amount), { type: "i128" })
    )
  )
  .setTimeout(300)
  .build();

  const preparedTx = await server.prepareTransaction(tx);
  const signResult = await signTransaction(preparedTx.toXDR(), {
    networkPassphrase: "Test SDF Network ; September 2015",
  });
  
  if (signResult.error) {
    throw new Error(signResult.error as string);
  }

  const submittedTx = TransactionBuilder.fromXDR(signResult.signedTxXdr, Networks.TESTNET);
  const sendResult = await server.sendTransaction(submittedTx);
  
  if (sendResult.status === "ERROR") {
    throw new Error(`Transaction failed: ${JSON.stringify(sendResult.errorResult)}`);
  }

  let txResult = await server.getTransaction(sendResult.hash);
  while (txResult.status === rpc.Api.GetTransactionStatus.NOT_FOUND) {
    await new Promise((resolve) => setTimeout(resolve, 1500));
    txResult = await server.getTransaction(sendResult.hash);
  }

  if (txResult.status === rpc.Api.GetTransactionStatus.SUCCESS) {
    return {
      hash: sendResult.hash,
      result: txResult
    };
  } else {
    throw new Error(`Transaction failed: ${txResult.status}`);
  }
}
