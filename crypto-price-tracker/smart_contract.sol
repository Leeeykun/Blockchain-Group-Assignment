// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";

contract SimpleCryptoPriceTracker {
    address public owner;
    
    struct Price {
        uint256 price;
        uint256 timestamp;
        int256 changePercent;
        uint256 volume;
        uint256 high24h;
        uint256 low24h;
    }

    struct CurrencyInfo {
        string name;
        string symbol;
        bool isActive;
    }

    mapping(string => Price) public prices;
    mapping(string => CurrencyInfo) public currencyInfo;
    mapping(string => AggregatorV3Interface) public priceFeeds;
    
    string[] public supportedCurrencies;

    event PriceUpdated(string symbol, uint256 price, uint256 timestamp);
    event PriceFeedSet(string symbol, address priceFeed);
    event CurrencyAdded(string symbol, string name);

    constructor() {
        owner = msg.sender;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }

    function addCurrency(
        string memory symbol,
        string memory name,
        address priceFeed
    ) public onlyOwner {
        require(bytes(symbol).length > 0, "Symbol cannot be empty");
        require(bytes(name).length > 0, "Name cannot be empty");
        require(priceFeed != address(0), "Invalid price feed address");
        require(!currencyInfo[symbol].isActive, "Currency already exists");

        currencyInfo[symbol] = CurrencyInfo(name, symbol, true);
        priceFeeds[symbol] = AggregatorV3Interface(priceFeed);
        supportedCurrencies.push(symbol);

        emit CurrencyAdded(symbol, name);
        emit PriceFeedSet(symbol, priceFeed);
    }

    function updatePrice(string memory symbol) public {
        require(currencyInfo[symbol].isActive, "Currency not supported");
        
        AggregatorV3Interface priceFeed = priceFeeds[symbol];
        require(address(priceFeed) != address(0), "Price feed not set");

        (
            /* uint80 roundID */,
            int price,
            /* uint startedAt */,
            uint timeStamp,
            /* uint80 answeredInRound */
        ) = priceFeed.latestRoundData();

        require(timeStamp > 0, "Price not available");
        require(price > 0, "Invalid price");

        uint256 currentPrice = uint256(price);
        
        // 使用区块信息生成伪随机数
        uint256 randomValue = uint256(keccak256(abi.encodePacked(
            block.timestamp,
            block.prevrandao,
            msg.sender
        )));
        
        // 生成价格变化百分比 (-5% 到 +5%)
        int256 changePercent = int256(randomValue % 1000) - 500;
        
        // 生成交易量 (1M 到 10M)
        uint256 volume = (randomValue % 9000000) + 1000000;
        
        prices[symbol] = Price(
            currentPrice,
            timeStamp,
            changePercent,
            volume,
            currentPrice + (currentPrice * 5 / 100),  // +5%
            currentPrice - (currentPrice * 5 / 100)   // -5%
        );

        emit PriceUpdated(symbol, currentPrice, timeStamp);
    }

    function getSupportedCurrencies() public view returns (string[] memory) {
        return supportedCurrencies;
    }

    function getPrice(string memory symbol) public view returns (
        uint256 price,
        uint256 timestamp,
        int256 changePercent,
        uint256 volume,
        uint256 high24h,
        uint256 low24h
    ) {
        require(currencyInfo[symbol].isActive, "Currency not supported");
        Price memory p = prices[symbol];
        return (
            p.price,
            p.timestamp,
            p.changePercent,
            p.volume,
            p.high24h,
            p.low24h
        );
    }

    function getCurrencyInfo(string memory symbol) public view returns (
        string memory name,
        string memory symbolRet,
        bool isActive
    ) {
        CurrencyInfo memory info = currencyInfo[symbol];
        return (info.name, info.symbol, info.isActive);
    }
}