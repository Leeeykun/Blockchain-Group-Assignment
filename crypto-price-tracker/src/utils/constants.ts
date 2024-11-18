import PriceTrackerABI from '../abi/PriceTracker.json';

// Sepolia 测试网配置
export const NETWORK_CONFIG = {
  chainId: '0xaa36a7', // Sepolia的chainId
  chainName: 'Sepolia Test Network',
  nativeCurrency: {
    name: 'Sepolia Ether',
    symbol: 'SEP',
    decimals: 18
  },
  blockExplorerUrls: ['https://sepolia.etherscan.io']
};

// 价格追踪器合约地址
export const PRICE_TRACKER_ADDRESS = '0x1b43Dd05DB9e865bfDF0d490C0D0a5d856b3c888';

// 导出 ABI
export const PRICE_TRACKER_ABI = PriceTrackerABI;