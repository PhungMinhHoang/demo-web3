import { WalletName } from "@solana/wallet-adapter-base";
import { useWallet } from "@solana/wallet-adapter-react";
import { Flex } from "antd";
import { FC } from "react";

type Props = {
  onSelect: (walletName: WalletName) => void;
};

export const WalletSelect: FC<Props> = ({ onSelect }) => {
  const { wallets } = useWallet();

  return (
    <>
      {wallets.map(({ adapter, readyState }) => (
        <Flex
          justify="space-between"
          align="center"
          key={adapter.name}
          style={{
            marginBottom: "16px",
            border: "1px solid",
            borderRadius: "5px",
            padding: "8px",
            cursor: "pointer",
          }}
          onClick={() => onSelect(adapter.name)}
        >
          <div>
            {adapter.name} {readyState}
          </div>
          <img src={adapter.icon} width={30}></img>
        </Flex>
      ))}
    </>
  );
};
