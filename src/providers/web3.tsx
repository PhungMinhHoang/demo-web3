import { FC, PropsWithChildren, useMemo } from "react";
import {
  LedgerWalletAdapter,
  PhantomWalletAdapter,
  TorusWalletAdapter,
} from "@solana/wallet-adapter-wallets";
import {
  ConnectionProvider,
  WalletProvider,
} from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";

import("@solana/wallet-adapter-react-ui/styles.css");

export const Web3Provider: FC<PropsWithChildren> = ({ children }) => {
  const endpoint =
    "https://boldest-convincing-yard.solana-mainnet.quiknode.pro/";

  // @solana/wallet-adapter-wallets includes all the adapters but supports tree shaking --
  // Only the wallets you configure here will be compiled into your application
  const wallets = useMemo(
    () => [
      //new PhantomWalletAdapter(),
      //new SlopeWalletAdapter(),
      //new TorusWalletAdapter(),
      //new LedgerWalletAdapter(),
    ],
    []
  );

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>{children}</WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
};
