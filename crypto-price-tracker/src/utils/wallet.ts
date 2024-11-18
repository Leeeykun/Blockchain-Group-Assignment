import { ethers } from 'ethers';


export const connectWallet = async (): Promise<string> => {
  try {
    if (!window.ethereum) {
      throw new Error("Please install MetaMask!");
    }

    // 请求用户授权
    const accounts = await window.ethereum.request({
      method: "eth_requestAccounts",
    });

    return accounts[0];
  } catch (error) {
    console.error("Error connecting to wallet:", error);
    throw error;
  }
};

export const addWalletListener = (setAccount: (account: string) => void): void => {
  if (window.ethereum) {
    window.ethereum.on("accountsChanged", (accounts: string[]) => {
      if (accounts.length > 0) {
        setAccount(accounts[0]);
      } else {
        setAccount('');  // 当用户断开连接时，使用空字符串而不是 null
      }
    });
  }
};