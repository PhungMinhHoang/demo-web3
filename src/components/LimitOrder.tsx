import { Flex, Input, Select } from "antd";
import { FC, useState } from "react";
import tokenInfos from "../tokens.json";
import { useSolana } from "../hooks";

export const LimitOrder: FC = () => {
  const selectOptions = tokenInfos.map((token) => {
    return { label: token.name, value: token.mint };
  });

  const [tokenSell, setTokenSell] = useState();
  const [tokenBuy, setTokenBuy] = useState();

  const { getTokenInfo } = useSolana();

  return (
    <>
      <div>
        <div>You're Selling</div>
        <Flex style={{ padding: "16px", gap: "16px" }} justify="center">
          <Select
            value={tokenSell}
            placeholder="Select token"
            options={selectOptions}
            onChange={(value) => setTokenSell(value)}
            style={{ width: "200px" }}
          ></Select>

          <div>
            <Input placeholder="0.00"></Input>
          </div>
        </Flex>
      </div>

      {tokenBuy && (
        <div>
          Buy {getTokenInfo(tokenBuy).name} at rate
          <Input />
        </div>
      )}
      
      <div>
        <div>You're Buying</div>
        <Flex style={{ padding: "16px", gap: "16px" }} justify="center">
          <Select
            value={tokenBuy}
            placeholder="Select token"
            options={selectOptions}
            onChange={(value) => setTokenBuy(value)}
            style={{ width: "200px" }}
          ></Select>

          <div>
            <Input placeholder="0.00"></Input>
          </div>
        </Flex>
      </div>
    </>
  );
};
