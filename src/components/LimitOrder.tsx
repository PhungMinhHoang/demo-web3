import { Button, Flex, Input, InputNumber, Select } from "antd";
import { FC, useEffect, useState } from "react";
import tokenInfos from "../tokens.json";
import { useSolana } from "../hooks";
import {
  Keypair,
  VersionedTransaction,
  sendAndConfirmRawTransaction,
} from "@solana/web3.js";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";

type TokenInfo = {
  mint: string;
  tokenAmount: {
    amount?: string;
    decimals?: number;
    uiAmount: number;
    uiAmountString: string;
  };
  imageUri: string;
  name: string;
  symbol: string;
  price: {
    price: number;
    change: number;
    usdPrice: number;
    usdChange: number;
    currency: string;
  };
};

type Props = {
  tokens: TokenInfo[];
};

export const LimitOrder: FC<Props> = ({ tokens }) => {
  const selectOptions = tokenInfos.map((token) => {
    return { label: token.name, value: token.mint };
  });

  const [tokenSell, setTokenSell] = useState(tokenInfos[0].mint);
  const [tokenBuy, setTokenBuy] = useState(tokenInfos[1].mint);
  const [sellAmount, setSellAmount] = useState(0);
  const [rate, setRate] = useState(0);

  const { getTokenInfo } = useSolana();

  const setMarketRate = () => {
    const tokenSellPrice = getTokenInfo(tokenSell).price?.usdPrice;
    const tokenBuyPrice = getTokenInfo(tokenBuy).price?.usdPrice;

    const rate = tokenSellPrice / tokenBuyPrice;
    setRate(rate);
  };

  useEffect(() => {
    setMarketRate();
  }, [tokenSell, tokenBuy]);

  const getTokenAmount = (mint: string) => {
    const token = tokens.find((token) => token.mint === mint);

    if (token) {
      return token.tokenAmount.uiAmount;
    }

    return 0;
  };

  const { wallet, signTransaction } = useWallet();
  const { connection } = useConnection();

  const createLimitOrder = async () => {
    // Base key are used to generate a unique order id
    const base = Keypair.generate();

    // get serialized transactions
    const transactions = await (
      await fetch("https://jup.ag/api/limit/v1/createOrder", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          owner: wallet?.adapter.publicKey.toString(),
          inAmount: sellAmount,
          outAmount: sellAmount * rate,
          inputMint: tokenSell,
          outputMint: tokenBuy,
          expiredAt: null,
          base: base.publicKey.toString(),
          // referralAccount and name are both optional
          // provide both to get referral fees
          // more details in the section below
          // referralAccount: referral.publicKey.toString(),
          // referralName: "Referral Name",
        }),
      })
    ).json();

    const { orderPubkey, tx } = transactions;

    // deserialize the transaction
    const transactionBuf = Buffer.from(tx, "base64");
    var transaction = VersionedTransaction.deserialize(transactionBuf);

    // sign the transaction using the required key
    // for create order, wallet and base key are required.
    const signedTransaction = await signTransaction(transaction);
    //transaction.sign([wallet?.adapter, base]);

    // Execute the transaction
    const rawTransaction = signedTransaction.serialize();
    const txid = await connection.sendRawTransaction(rawTransaction, {
      skipPreflight: true,
      maxRetries: 2,
    });

    //const response =  sendAndConfirmRawTransaction(connection,rawTransaction,)
    const blockhashObject = await connection.getLatestBlockhash();
    debugger
    // await connection.confirmTransaction({
    //   signature: txid,
    //   ...blockhashObject,
    // });
    debugger
    
    console.log(`https://solscan.io/tx/${txid}`);
  };

  return (
    <>
      <div>
        <div>You're Selling</div>
        <Flex
          style={{ padding: "16px", gap: "16px" }}
          justify="center"
          align="center"
        >
          <Select
            value={tokenSell}
            placeholder="Select token"
            options={selectOptions}
            onChange={(value) => setTokenSell(value)}
            style={{ width: "150px" }}
          ></Select>

          <InputNumber
            placeholder="0.00"
            value={sellAmount}
            onChange={(value) => setSellAmount(value || 0)}
            addonBefore={
              <span
                onClick={() => setSellAmount(getTokenAmount(tokenSell))}
                style={{ cursor: "pointer" }}
              >
                max
              </span>
            }
            addonAfter={`$${
              sellAmount * getTokenInfo(tokenSell).price!.usdPrice
            }`}
          ></InputNumber>
        </Flex>
      </div>

      <div style={{ marginBottom: "16px" }}>
        Sell {getTokenInfo(tokenSell).name} at rate
        <div>
          <InputNumber
            value={rate}
            onChange={(value) => setRate(value || 0)}
            addonBefore={
              <span
                onClick={() => setMarketRate()}
                style={{ cursor: "pointer" }}
              >
                Use Market
              </span>
            }
            style={{ width: "200px" }}
          />{" "}
          {getTokenInfo(tokenBuy).name}
        </div>
      </div>

      <div>
        <div>You're Buying</div>
        <Flex style={{ padding: "16px", gap: "16px" }} justify="center">
          <Select
            value={tokenBuy}
            placeholder="Select token"
            options={selectOptions}
            onChange={(value) => setTokenBuy(value)}
            style={{ width: "150px" }}
          ></Select>

          <div>
            <Input
              readOnly
              placeholder="0.00"
              value={sellAmount * rate}
            ></Input>
          </div>
        </Flex>
      </div>

      <Button onClick={createLimitOrder}>Place Limit Order</Button>
    </>
  );
};
