import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { sepolia } from 'wagmi/chains';

export const config = getDefaultConfig({
  appName: 'ERC-4337 Account Abstraction Demo',
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || '3b6026c80b6c8489cc1ac86d0cfe5044',
  chains: [sepolia],
  ssr: true,
});

// Contract addresses from our deployment (updated with deployed_addresses.json)
export const CONTRACT_ADDRESSES = {
  entryPoint: '0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789',
  simpleAccountFactory: '0x6E532B9e22A8F31105C741658989Ca79da3Fb11A',
  sponsorPaymaster: '0x61d222f1e0386a7Af71C865fF83Ad4CEd1131011',
  testToken: '0xab230E033D846Add5367Eb48BdCC4928259239a8',
} as const;

// Known account address from our deployment (already deployed on Sepolia)
export const DEMO_ACCOUNT_ADDRESS = '0xe6C10E95f8AEF841e766018Cd08944602Bc7EFC2';

// Private key for the SimpleAccount owner (sponsor wallet - for demo purposes only)
export const DEMO_PRIVATE_KEY = '0xf940ad78f04aee09ea25f8233fb4919f787cd302c215644e7084d194a0459322';

export const SEPOLIA_RPC_URL = 'https://eth-sepolia.g.alchemy.com/v2/TOesvxt49zaYfum1kkgS6';