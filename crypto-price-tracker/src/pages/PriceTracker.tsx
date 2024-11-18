import React, { useEffect, useState } from 'react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { ethers } from 'ethers';
import { PRICE_TRACKER_ABI, PRICE_TRACKER_ADDRESS } from '../utils/constants';
import { connectWallet, addWalletListener } from '../utils/wallet';
import './PriceTracker.css';

interface TokenData {
  name: string;
  symbol: string;
  price: string;
  changePercent: number;
  high24h: string;
  low24h: string;
  volume: string;
  lastUpdate: number;
}

interface PriceHistoryItem {
  timestamp: number;
  price: number;
}

const generateMockPriceHistory = (
  currentPrice: number,
  symbol: string,
  hoursBack: number = 24
): PriceHistoryItem[] => {
  const now = Date.now();
  const history: PriceHistoryItem[] = [];
  
  const volatilityMap: { [key: string]: number } = {
    'BTC': 0.03,
    'ETH': 0.04,
    'USDT': 0.001,
    'DEFAULT': 0.05
  };
  
  const volatility = (volatilityMap[symbol] || volatilityMap.DEFAULT) * currentPrice;
  let lastPrice = currentPrice;
  
  const totalPoints = hoursBack * 2;
  
  for (let i = totalPoints - 1; i >= 0; i--) {
    const timestamp = now - i * 30 * 60 * 1000;
    const trend = Math.sin(i / 8) * volatility * 0.5;
    const random = (Math.random() - 0.5) * volatility;
    const smoothing = 0.7;
    
    lastPrice = lastPrice * (1 + (trend + random) * (1 - smoothing)) +
                currentPrice * smoothing;
    
    history.push({
      timestamp,
      price: Number(lastPrice.toFixed(2))
    });
  }
  
  return history;
};

const PriceTracker: React.FC = () => {
  const [account, setAccount] = useState<string>('');
  const [selectedCurrency, setSelectedCurrency] = useState<string>('ETH');
  const [priceHistory, setPriceHistory] = useState<PriceHistoryItem[]>([]);
  const [currentTokenData, setCurrentTokenData] = useState<TokenData | null>(null);
  const [contract, setContract] = useState<ethers.Contract | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [supportedCurrencies, setSupportedCurrencies] = useState<string[]>([]);

  const handleConnectWallet = async () => {
    setLoading(true);
    try {
      const account = await connectWallet();
      setAccount(account);
      
      if (window.ethereum) {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();
        const priceTrackerContract = new ethers.Contract(
          PRICE_TRACKER_ADDRESS,
          PRICE_TRACKER_ABI,
          signer
        );
        setContract(priceTrackerContract);
        
        const currencies = await priceTrackerContract.getSupportedCurrencies();
        setSupportedCurrencies(currencies);
      }
    } catch (error) {
      console.error('Failed to connect wallet:', error);
      alert('Failed to connect wallet. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchCurrentTokenData = async () => {
    if (!contract || !selectedCurrency) return;

    try {
      const [price, timestamp, changePercent, volume, high24h, low24h] = 
        await contract.getPrice(selectedCurrency);
      
      const [name, symbol, isActive] = await contract.getCurrencyInfo(selectedCurrency);

      if (!isActive) {
        throw new Error("Currency is not active");
      }

      const tokenData: TokenData = {
        name,
        symbol,
        price: ethers.utils.formatUnits(price, 8),
        changePercent: changePercent.toNumber() / 100,
        high24h: ethers.utils.formatUnits(high24h, 8),
        low24h: ethers.utils.formatUnits(low24h, 8),
        volume: ethers.utils.formatUnits(volume, 8),
        lastUpdate: timestamp.toNumber() * 1000
      };

      setCurrentTokenData(tokenData);

      const mockHistory = generateMockPriceHistory(
        Number(tokenData.price),
        selectedCurrency
      );
      setPriceHistory(mockHistory);
    } catch (error) {
      console.error('Error fetching token data:', error);
    }
  };

  const updatePrice = async () => {
    if (!contract || !selectedCurrency) return;
    
    try {
      setLoading(true);
      const tx = await contract.updatePrice(selectedCurrency);
      await tx.wait();
      await fetchCurrentTokenData();
      alert('Price updated successfully!');
    } catch (error) {
      console.error('Error updating price:', error);
      alert('Failed to update price. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const updateAllPrices = async () => {
    if (!contract) return;
    
    try {
      setLoading(true);
      // 为每个支持的货币创建更新交易
      const updatePromises = supportedCurrencies.map(async (currency) => {
        try {
          const tx = await contract.updatePrice(currency);
          await tx.wait();
          return { currency, success: true };
        } catch (error) {
          return { currency, success: false };
        }
      });

      // 等待所有更新完成
      const results = await Promise.all(updatePromises);
      
      // 检查结果
      const failures = results.filter(r => !r.success).map(r => r.currency);
      if (failures.length > 0) {
        alert(`Failed to update prices for: ${failures.join(', ')}`);
      } else {
        alert('All prices updated successfully!');
      }

      // 刷新显示的价格数据
      await fetchCurrentTokenData();
    } catch (error) {
      console.error('Error updating prices:', error);
      alert('Failed to update prices. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    addWalletListener(setAccount);
  }, []);

  useEffect(() => {
    if (contract && selectedCurrency) {
      fetchCurrentTokenData();
      const interval = setInterval(fetchCurrentTokenData, 30000);
      return () => clearInterval(interval);
    }
  }, [contract, selectedCurrency]);

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return `${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`;
  };

  const formatPrice = (price: string) => {
    return Number(price).toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD'
    });
  };

  return (
    <div className="price-tracker-container">
      <div className="header">
        <h1>Crypto Price Tracker</h1>
        {!account ? (
          <button 
            className="connect-button"
            onClick={handleConnectWallet}
            disabled={loading}
          >
            {loading ? 'Connecting...' : 'Connect MetaMask'}
          </button>
        ) : (
          <div className="account-info">
            Connected: {account.slice(0, 6)}...{account.slice(-4)}
          </div>
        )}
      </div>

      {!account ? (
        <div className="connect-prompt">
          <p>Please connect your MetaMask wallet to view price information</p>
        </div>
      ) : (
        <div className="content">
          <div className="currency-controls">
            <div className="currency-selector">
              <select 
                value={selectedCurrency}
                onChange={(e) => setSelectedCurrency(e.target.value)}
              >
                {supportedCurrencies.map((currency) => (
                  <option key={currency} value={currency}>{currency}</option>
                ))}
              </select>
            </div>
            <button 
              className="update-all-button"
              onClick={updateAllPrices}
              disabled={loading}
            >
              {loading ? 'Updating All...' : 'Update All Prices'}
            </button>
          </div>

          {currentTokenData && (
            <div className="price-card">
              <div className="price-card-header">
                <h2>{currentTokenData.name} ({currentTokenData.symbol})</h2>
                <button 
                  className="update-button"
                  onClick={updatePrice}
                  disabled={loading}
                >
                  {loading ? 'Updating...' : 'Update Price'}
                </button>
              </div>
              <p className="current-price">{formatPrice(currentTokenData.price)}</p>
              <div className="price-details">
                <div className={`change-percent ${currentTokenData.changePercent >= 0 ? 'positive' : 'negative'}`}>
                  24h Change: {currentTokenData.changePercent.toFixed(2)}%
                </div>
                <div className="high-low">
                  <span>24h High: {formatPrice(currentTokenData.high24h)}</span>
                  <span>24h Low: {formatPrice(currentTokenData.low24h)}</span>
                </div>
                <div className="volume">
                  Volume: {formatPrice(currentTokenData.volume)}
                </div>
              </div>
            </div>
          )}

          <div className="chart-container">
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={priceHistory}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="timestamp" 
                  tickFormatter={formatTime}
                  interval="preserveStartEnd"
                />
                <YAxis 
                  domain={['auto', 'auto']}
                  tickFormatter={(value) => `$${value.toFixed(2)}`}
                />
                <Tooltip 
                  labelFormatter={formatTime}
                  formatter={(value: any) => [`$${value.toFixed(2)}`, 'Price']}
                />
                <Line 
                  type="monotone" 
                  dataKey="price" 
                  stroke="#2196f3" 
                  dot={false}
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
};

export default PriceTracker;