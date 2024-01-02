import {
  SystemProgram,
  Keypair,
  Transaction,
  sendAndConfirmTransaction,
  Connection,
  clusterApiUrl,
  LAMPORTS_PER_SOL,
  PublicKey,
} from "@solana/web3.js";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { HDKey } from "micro-ed25519-hdkey";

import * as bip39 from "bip39";
import base58 from "bs58";

import { ACCOUNT_PRIVATE_KEY } from "../constant";
import tokenInfos from "../tokens.json";
import { useConnection } from "@solana/wallet-adapter-react";

export const useSolana = () => {
  const { connection } = useConnection();

  const createAccount = async () => {
    /** The account that will transfer lamports to the created account */
    const fromKeyPair = Keypair.fromSecretKey(
      base58.decode(ACCOUNT_PRIVATE_KEY)
    );

    // Airdrop SOL for transferring lamports to the created account
    // const airdropSignature = await connection.requestAirdrop(
    //   fromKeyPair.publicKey,
    //   LAMPORTS_PER_SOL
    // );
    // const blockhashObject = await connection.getLatestBlockhash();
    // await connection.confirmTransaction({
    //   signature: airdropSignature,
    //   ...blockhashObject,
    // });

    // amount of space to reserve for the account
    const space = 0;

    // Seed the created account with lamports for rent exemption
    // const rentExemptionAmount =
    //   await connection.getMinimumBalanceForRentExemption(space);

    // Create pass phrase for new account
    const passPhrase = bip39.generateMnemonic();
    const seed = bip39.mnemonicToSeedSync(passPhrase, "");

    const newAccountKeyPair = Keypair.fromSeed(seed.subarray(0, 32));

    // const createAccountParams = {
    //   fromPubkey: fromKeyPair.publicKey,
    //   newAccountPubkey: newAccountKeyPair.publicKey,
    //   lamports: rentExemptionAmount,
    //   space,
    //   programId: SystemProgram.programId,
    // };

    // const createAccountTransaction = new Transaction().add(
    //   SystemProgram.createAccount(createAccountParams)
    // );

    // const response = await sendAndConfirmTransaction(
    //   connection,
    //   createAccountTransaction,
    //   [fromKeyPair, newAccountKeyPair]
    // );

    return {
      secretKey: base58.encode(newAccountKeyPair.secretKey),
      passPhrase,
    };
  };

  const importWalletByPassPhrase = async (passPhrase: string) => {
    const seed = bip39.mnemonicToSeedSync(passPhrase, "");

    const hd = HDKey.fromMasterSeed(seed.toString("hex"));

    let index = 0;
    const accountKeypairs = [];
    do {
      const path = `m/44'/501'/${index}'/0'`;
      const keypair = Keypair.fromSeed(hd.derive(path).privateKey);

      try {
        const info = await connection.getAccountInfo(keypair.publicKey);

        if (!info) break;

        accountKeypairs.push(keypair);
        index++;
      } catch (error) {
        break;
      }
    } while (true);

    return accountKeypairs;
  };

  const getAccountBalance = async (pubKey: string) => {
    const wallet = new PublicKey(pubKey);

    const balance = (await connection.getBalance(wallet)) / LAMPORTS_PER_SOL;
    return balance;
  };

  const getAllTokenAccountByOwner = async (pubKey: string) => {
    const owner = new PublicKey(pubKey);
    const tokenAccounts = [];

    const response = await connection.getParsedTokenAccountsByOwner(owner, {
      programId: TOKEN_PROGRAM_ID,
    });

    for (let index = 0; index < response.value.length; index++) {
      const accountInfo = response.value[index].account.data.parsed.info;
      tokenAccounts.push(accountInfo);
    }

    return tokenAccounts;
  };

  const getTokenInfo = (mint: string) => {
    const token = tokenInfos.find((token) => token.mint === mint);

    if (token) {
      const { name, symbol, imageUri, price } = token;
      return { name, symbol, imageUri, price };
    }

    return {};
  };

  return {
    createAccount,
    importWalletByPassPhrase,
    getAccountBalance,
    getAllTokenAccountByOwner,
    getTokenInfo,
  };
};
