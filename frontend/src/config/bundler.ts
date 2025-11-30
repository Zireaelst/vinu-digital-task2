/**
 * Bundler Configuration
 * 
 * ERC-4337 Bundler endpoints for Sepolia testnet
 * 
 * PUBLIC BUNDLERS (No API key required):
 * - Pimlico: Free public endpoints with rate limits
 * - Biconomy: Public bundler for testing
 * - Candide: Voltaire bundler (may have restrictions)
 * 
 * PRODUCTION: Get your own API keys from:
 * - Pimlico: https://dashboard.pimlico.io
 * - Stackup: https://app.stackup.sh
 * - Alchemy: https://www.alchemy.com
 */

export interface BundlerConfig {
  name: string;
  endpoint: string;
  requiresApiKey: boolean;
  isPublic: boolean;
  chainId: number;
}

// Sepolia chainId
export const SEPOLIA_CHAIN_ID = 11155111;

/**
 * Available bundler endpoints
 * Ordered by reliability and preference
 */
export const BUNDLER_CONFIGS: BundlerConfig[] = [
  {
    name: 'Pimlico Public',
    endpoint: 'https://api.pimlico.io/v2/sepolia/rpc?apikey=public',
    requiresApiKey: false,
    isPublic: true,
    chainId: SEPOLIA_CHAIN_ID,
  },
  {
    name: 'Biconomy',
    endpoint: 'https://bundler.biconomy.io/api/v2/11155111/nJPK7B3ru.dd7f7861-190d-41bd-af80-6877f74b8f44',
    requiresApiKey: false,
    isPublic: true,
    chainId: SEPOLIA_CHAIN_ID,
  },
  {
    name: 'Candide Voltaire',
    endpoint: 'https://sepolia.voltaire.candidewallet.com/rpc',
    requiresApiKey: false,
    isPublic: true,
    chainId: SEPOLIA_CHAIN_ID,
  },
];

/**
 * Get bundler endpoint URLs
 */
export function getBundlerEndpoints(): string[] {
  return BUNDLER_CONFIGS.map(config => config.endpoint);
}

/**
 * Get bundler configuration by name
 */
export function getBundlerConfig(name: string): BundlerConfig | undefined {
  return BUNDLER_CONFIGS.find(config => config.name === name);
}

/**
 * Environment variable for custom bundler API key
 * Set NEXT_PUBLIC_BUNDLER_API_KEY in .env.local for production
 */
export function getCustomBundlerEndpoint(): string | null {
  const apiKey = process.env.NEXT_PUBLIC_BUNDLER_API_KEY;
  
  if (!apiKey) {
    return null;
  }
  
  // Stackup with custom API key
  return `https://api.stackup.sh/v1/node/${SEPOLIA_CHAIN_ID}/${apiKey}`;
}

/**
 * Get all available bundler endpoints including custom ones
 */
export function getAllBundlerEndpoints(): string[] {
  const endpoints = getBundlerEndpoints();
  const customEndpoint = getCustomBundlerEndpoint();
  
  if (customEndpoint) {
    // Prioritize custom endpoint
    return [customEndpoint, ...endpoints];
  }
  
  return endpoints;
}
