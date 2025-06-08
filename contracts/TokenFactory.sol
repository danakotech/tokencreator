// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./CustomToken.sol";

contract TokenFactory {
    address public owner;
    address public feeReceiver;
    uint256 public baseFee = 0.002 ether;
    uint256 public featurePrice = 0.001 ether;
    
    address[] public deployedTokens;
    mapping(address => address[]) public userTokens;
    
    event TokenCreated(
        address indexed tokenAddress,
        address indexed creator,
        string name,
        string symbol,
        uint256 totalSupply,
        uint8 decimals,
        bool[] features,
        uint256 paidAmount
    );
    
    constructor(address _feeReceiver) {
        owner = msg.sender;
        feeReceiver = _feeReceiver;
    }
    
    function createToken(
        string memory name,
        string memory symbol,
        uint256 totalSupply,
        uint8 decimals,
        bool[] memory features
    ) external payable returns (address) {
        // Calculate price based on features
        uint256 price = calculatePrice(features);
        require(msg.value >= price, "Insufficient payment");
        
        // Deploy new token
        CustomToken newToken = new CustomToken(
            name,
            symbol,
            totalSupply,
            decimals,
            features,
            msg.sender
        );
        
        // Record deployment
        address tokenAddress = address(newToken);
        deployedTokens.push(tokenAddress);
        userTokens[msg.sender].push(tokenAddress);
        
        // Transfer fee to fee receiver
        (bool sent, ) = feeReceiver.call{value: msg.value}("");
        require(sent, "Failed to send payment");
        
        // Emit event
        emit TokenCreated(
            tokenAddress,
            msg.sender,
            name,
            symbol,
            totalSupply,
            decimals,
            features,
            msg.value
        );
        
        return tokenAddress;
    }
    
    function calculatePrice(bool[] memory features) public view returns (uint256) {
        uint256 price = baseFee;
        
        // Count active features (skip ownership which is always included)
        for (uint i = 0; i < features.length; i++) {
            if (features[i]) {
                price += featurePrice;
            }
        }
        
        return price;
    }
    
    function getDeployedTokens() external view returns (address[] memory) {
        return deployedTokens;
    }
    
    function getUserTokens(address user) external view returns (address[] memory) {
        return userTokens[user];
    }
    
    // Admin functions
    function updateFeeReceiver(address _feeReceiver) external {
        require(msg.sender == owner, "Only owner");
        feeReceiver = _feeReceiver;
    }
    
    function updatePrices(uint256 _baseFee, uint256 _featurePrice) external {
        require(msg.sender == owner, "Only owner");
        baseFee = _baseFee;
        featurePrice = _featurePrice;
    }
    
    function transferOwnership(address newOwner) external {
        require(msg.sender == owner, "Only owner");
        owner = newOwner;
    }
}
