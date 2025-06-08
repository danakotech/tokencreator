// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

contract CustomToken is ERC20, Ownable, Pausable {
    uint8 private _decimals;
    bool public isBurnable;
    bool public isMintable;
    bool public isPausable;
    bool public isDeflationary;
    bool public isAntiWhale;
    
    // Anti-whale settings
    uint256 public maxTransactionAmount;
    uint256 public maxWalletAmount;
    
    // Deflation rate (1% by default)
    uint256 public deflationRate = 100; // 1%
    
    constructor(
        string memory name,
        string memory symbol,
        uint256 totalSupply,
        uint8 decimals,
        bool[] memory features,
        address tokenOwner
    ) ERC20(name, symbol) Ownable(tokenOwner) {
        _decimals = decimals;
        
        // Features:
        // [0] = burnable
        // [1] = mintable
        // [2] = pausable
        // [3] = deflationary
        // [4] = antiWhale
        
        require(features.length >= 5, "Invalid features array");
        
        isBurnable = features[0];
        isMintable = features[1];
        isPausable = features[2];
        isDeflationary = features[3];
        isAntiWhale = features[4];
        
        // If anti-whale is enabled, set default limits
        if (isAntiWhale) {
            maxTransactionAmount = (totalSupply * 2) / 100; // 2% of total supply
            maxWalletAmount = (totalSupply * 5) / 100; // 5% of total supply
        }
        
        // Mint initial supply to owner
        _mint(tokenOwner, totalSupply * (10 ** decimals));
    }
    
    function decimals() public view override returns (uint8) {
        return _decimals;
    }
    
    // Burnable functionality
    function burn(uint256 amount) public virtual {
        require(isBurnable, "Burning is disabled");
        _burn(_msgSender(), amount);
    }
    
    // Mintable functionality
    function mint(address to, uint256 amount) public onlyOwner {
        require(isMintable, "Minting is disabled");
        _mint(to, amount);
    }
    
    // Pausable functionality
    function pause() public onlyOwner {
        require(isPausable, "Pausing is disabled");
        _pause();
    }
    
    function unpause() public onlyOwner {
        require(isPausable, "Pausing is disabled");
        _unpause();
    }
    
    // Anti-whale settings
    function setMaxTransactionAmount(uint256 amount) public onlyOwner {
        require(isAntiWhale, "Anti-whale is disabled");
        maxTransactionAmount = amount;
    }
    
    function setMaxWalletAmount(uint256 amount) public onlyOwner {
        require(isAntiWhale, "Anti-whale is disabled");
        maxWalletAmount = amount;
    }
    
    // Override transfer functions for deflationary and anti-whale mechanisms
    function _update(address from, address to, uint256 amount) internal override whenNotPaused {
        // Anti-whale checks
        if (isAntiWhale && from != address(0) && to != address(0)) {
            // Skip checks for owner
            if (from != owner() && to != owner()) {
                if (maxTransactionAmount > 0) {
                    require(amount <= maxTransactionAmount, "Exceeds max transaction amount");
                }
                
                if (maxWalletAmount > 0 && to != address(0)) {
                    require(balanceOf(to) + amount <= maxWalletAmount, "Exceeds max wallet amount");
                }
            }
        }
        
        // Deflationary mechanism
        if (isDeflationary && from != address(0) && to != address(0)) {
            // Skip burn for owner transfers
            if (from != owner() && to != owner()) {
                uint256 burnAmount = (amount * deflationRate) / 10000;
                if (burnAmount > 0) {
                    super._update(from, address(0), burnAmount); // Burn tokens
                    super._update(from, to, amount - burnAmount); // Transfer remaining
                    return;
                }
            }
        }
        
        // Standard transfer
        super._update(from, to, amount);
    }
}
