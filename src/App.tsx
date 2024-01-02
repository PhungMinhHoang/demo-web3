import { Button, Collapse, Flex, Form, Input, Modal } from "antd";
import "./App.css";
import { useSolana } from "./hooks";
import { useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "antd/es/form/Form";
import { useWallet } from "@solana/wallet-adapter-react";
import { truncateBetween } from "./utils";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";

type Wallet = {
  address: string;
  tokens: TokenInfo[];
};

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

function App() {
  const {
    createAccount,
    importWalletByPassPhrase,
    getAllTokenAccountByOwner,
    getTokenInfo,
    getAccountBalance,
  } = useSolana();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const passPhrase = useRef("");
  const [isLoading, setLoading] = useState(false);
  const [importError, setImportError] = useState("");

  const handleCreateAccount = async () => {
    const newAccount = await createAccount();
    passPhrase.current = newAccount.passPhrase;
    setIsModalOpen(true);
  };

  const [wallets, setWallets] = useState<Wallet[]>([]);
  const handleImportWalletByPassPhrase = async (formValues: {
    passPhrase: string[];
  }) => {
    setImportError("");
    setLoading(true);
    const importPassPhrase = formValues.passPhrase.join(" ");
    const walletKeypairs = await importWalletByPassPhrase(importPassPhrase);

    const promises = walletKeypairs.map(async (keypair) => {
      const pubKey = keypair.publicKey.toBase58();
      const tokens: TokenInfo[] = await getAllTokenAccountByOwner(
        keypair.publicKey.toBase58()
      );
      const balance = await getAccountBalance(pubKey);

      return { address: pubKey, tokens, balance };
    });

    const walletResponse = await Promise.all(promises);

    if (!walletResponse.length) {
      setImportError(
        "Maybe some words is not correct. We can not find your wallet."
      );
    } else {
      walletResponse.forEach((wallet) => {
        wallet.tokens = wallet.tokens.map((token) => {
          return { ...token, ...getTokenInfo(token.mint) };
        });

        wallet.tokens.unshift({
          mint: "11111111111111111111111111111111",
          tokenAmount: {
            uiAmount: wallet.balance,
            uiAmountString: wallet.balance.toString(),
          },
          ...getTokenInfo("11111111111111111111111111111111"),
        } as TokenInfo);
      });

      setWallets(walletResponse);
      setImportModalOpen(false);
      form.resetFields();
    }

    setLoading(false);
  };

  const dataWalletCollapseItems = useMemo(() => {
    return wallets.map(({ address, tokens }, index) => ({
      key: address,
      label: `Wallet ${index + 1} (${truncateBetween(address)})`,
      style: { color: "white" },
      children: (
        <Flex vertical gap={16}>
          {tokens.map((token) => (
            <Flex gap={8} key={token.mint}>
              <img
                src={token.imageUri}
                style={{ width: "50px", borderRadius: "50%" }}
              ></img>

              <div style={{ flex: 1 }}>
                <Flex justify="space-between">
                  <div>{token.name}</div>
                  {parseFloat(token.tokenAmount.uiAmount.toFixed(5)) +
                    " " +
                    token.symbol}
                </Flex>

                <Flex justify="space-between">
                  <div>${token.price.usdPrice}</div>
                  <div>
                    $
                    {parseFloat(
                      (
                        token.tokenAmount.uiAmount * token.price.usdPrice
                      ).toFixed(2)
                    )}
                  </div>
                </Flex>
              </div>
            </Flex>
          ))}
        </Flex>
      ),
    }));
  }, [wallets]);

  const [isImportModalOpen, setImportModalOpen] = useState(false);

  const [form] = useForm();
  const { wallet, connected, disconnect } = useWallet();
  useEffect(() => {
    async function fetchWalletTokenInfo() {
      const pubKey = wallet?.adapter?.publicKey?.toString() as string;

      const tokens: TokenInfo[] = await getAllTokenAccountByOwner(pubKey);
      const balance = await getAccountBalance(pubKey);

      const walletTokenInfo = {
        address: pubKey,
        tokens: [
          {
            mint: "11111111111111111111111111111111",
            tokenAmount: {
              uiAmount: balance,
              uiAmountString: balance.toString(),
            },
            ...getTokenInfo("11111111111111111111111111111111"),
          },
          ...tokens.map((token) => {
            return { ...token, ...getTokenInfo(token.mint) };
          }),
        ],
      } as Wallet;

      setWallets([walletTokenInfo]);
    }

    if (connected) {
      fetchWalletTokenInfo();
    } else {
      setWallets([]);
    }
  }, [connected]);

  return (
    <>
      <Flex vertical gap={16} style={{ width: "300px", margin: "auto" }}>
        <button onClick={handleCreateAccount}>Create Account</button>

        <button onClick={() => setImportModalOpen(true)}>
          Import Wallet from pass phrase
        </button>

        <WalletMultiButton />
      </Flex>

      {wallets.length > 0 && (
        <>
          <h3>We founded {wallets.length} wallets</h3>

          <Collapse
            items={dataWalletCollapseItems}
            defaultActiveKey={[wallets[0]?.address]}
            style={{ width: "800px" }}
          ></Collapse>
        </>
      )}

      <Modal
        title="Create account successfully"
        open={isModalOpen}
        footer={null}
        onCancel={() => setIsModalOpen(false)}
      >
        <h4>Save your pass phrase to restore your wallet later</h4>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, minmax(0,1fr))",
            gap: "16px",
          }}
        >
          {passPhrase.current.split(" ").map((pass) => (
            <Input readOnly value={pass} key={pass} />
          ))}
        </div>
      </Modal>

      <Modal
        title="Enter pass phrase to import your wallet"
        open={isImportModalOpen}
        footer={null}
        onCancel={() => setImportModalOpen(false)}
      >
        <Form
          form={form}
          onFinish={handleImportWalletByPassPhrase}
          initialValues={{ passPhrase: Array(12).fill("") }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, minmax(0,1fr))",
              gap: "16px",
            }}
          >
            <Form.List name="passPhrase">
              {(fields) => (
                <>
                  {fields.map((field, index) => (
                    <Form.Item {...field} rules={[{ required: true }]} noStyle>
                      <Input placeholder={`word ${index}`} />
                    </Form.Item>
                  ))}
                </>
              )}
            </Form.List>
          </div>

          {importError && (
            <div style={{ color: "red", marginTop: "8px" }}>{importError}</div>
          )}

          <Button
            loading={isLoading}
            type="primary"
            htmlType="submit"
            style={{ marginTop: "16px" }}
          >
            Import Wallet
          </Button>
        </Form>
      </Modal>
    </>
  );
}

export default App;
