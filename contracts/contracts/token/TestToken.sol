// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title TestToken
 * @dev ERC-20 token for testing ERC-4337 Account Abstraction transfers
 * @notice This token includes a freeMint function for easy testing
 */
contract TestToken is ERC20, Ownable {
    uint256 public constant MAX_MINT_PER_CALL = 1000000 * 10**18; // 1M tokens
    
    event FreeMint(address indexed to, uint256 amount);

    constructor(
        string memory name,
        string memory symbol,
        address initialOwner
    ) ERC20(name, symbol) {
        _transferOwnership(initialOwner);
        // Mint initial supply to owner (10M tokens)
        _mint(initialOwner, 10000000 * 10**decimals());
    }

    /**
     * @dev Allows anyone to mint tokens for testing purposes
     * @param to The address to mint tokens to
     * @param amount The amount of tokens to mint (with decimals)
     * @notice Limited to MAX_MINT_PER_CALL per transaction to prevent abuse
     */
    function freeMint(address to, uint256 amount) external {
        require(to != address(0), "TestToken: mint to zero address");
        require(amount > 0, "TestToken: mint amount must be positive");
        require(amount <= MAX_MINT_PER_CALL, "TestToken: mint amount exceeds limit");
        
        _mint(to, amount);
        emit FreeMint(to, amount);
    }

    /**
     * @dev Owner can mint unlimited tokens
     * @param to The address to mint tokens to
     * @param amount The amount of tokens to mint
     */
    function ownerMint(address to, uint256 amount) external onlyOwner {
        require(to != address(0), "TestToken: mint to zero address");
        require(amount > 0, "TestToken: mint amount must be positive");
        
        _mint(to, amount);
    }

    /**
     * @dev Returns the number of decimals for the token
     * @return The number of decimals (18)
     */
    function decimals() public pure override returns (uint8) {
        return 18;
    }
}