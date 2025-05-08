import { createWalletClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { baseSepolia } from "viem/chains";

// Create a wallet client (using your private key)
export const account = privateKeyToAccount(process.env.PRIVATE_KEY as `0x`);

export const client = createWalletClient({
  chain: baseSepolia,
  transport: http(),
  account
})
