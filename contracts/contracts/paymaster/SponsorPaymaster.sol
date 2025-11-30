// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "@account-abstraction/contracts/core/BasePaymaster.sol";
import "@account-abstraction/contracts/interfaces/IEntryPoint.sol";
import "@account-abstraction/contracts/interfaces/UserOperation.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

/**
 * @title SponsorPaymaster
 * @dev Paymaster contract that sponsors gas fees for whitelisted users
 * @notice This paymaster validates and pays for UserOperations from approved senders
 */
contract SponsorPaymaster is Ownable, BasePaymaster {
    using ECDSA for bytes32;

    mapping(address => bool) public whitelist;
    mapping(address => uint256) public sponsorDeposits;
    
    uint256 public constant MINIMUM_DEPOSIT = 0.01 ether;
    uint256 public maxCostPerUserOp = 0.005 ether; // 5000000 gwei max cost per op
    
    event UserWhitelisted(address indexed user, bool whitelisted);
    event SponsorDeposited(address indexed sponsor, uint256 amount);
    event SponsorWithdrawn(address indexed sponsor, uint256 amount);
    event UserOpSponsored(address indexed sender, uint256 actualGasCost);

    constructor(IEntryPoint _entryPoint, address _owner) BasePaymaster(_entryPoint) {
        _transferOwnership(_owner);
    }

    /**
     * @dev Add or remove a user from the whitelist
     * @param user The user address to whitelist/unwhitelist
     * @param whitelisted True to whitelist, false to remove
     */
    function setWhitelist(address user, bool whitelisted) external onlyOwner {
        whitelist[user] = whitelisted;
        emit UserWhitelisted(user, whitelisted);
    }

    /**
     * @dev Deposit ETH into EntryPoint for sponsoring gas fees
     */
    function depositForSponsor() external payable {
        require(msg.value >= MINIMUM_DEPOSIT, "SponsorPaymaster: deposit too small");
        entryPoint.depositTo{value: msg.value}(address(this));
        sponsorDeposits[msg.sender] += msg.value;
        emit SponsorDeposited(msg.sender, msg.value);
    }

    /**
     * @dev Owner can deposit on behalf of the paymaster
     */
    function depositForOwner() public payable onlyOwner {
        require(msg.value > 0, "SponsorPaymaster: deposit must be positive");
        entryPoint.depositTo{value: msg.value}(address(this));
    }

    /**
     * @dev Withdraw deposited ETH from EntryPoint
     * @param withdrawAddress Address to receive the withdrawn ETH
     * @param amount Amount to withdraw
     */
    function withdrawDeposit(address payable withdrawAddress, uint256 amount) public onlyOwner {
        entryPoint.withdrawTo(withdrawAddress, amount);
        emit SponsorWithdrawn(withdrawAddress, amount);
    }

    /**
     * @dev Set maximum cost per UserOperation
     * @param _maxCost New maximum cost in wei
     */
    function setMaxCostPerUserOp(uint256 _maxCost) external onlyOwner {
        maxCostPerUserOp = _maxCost;
    }

    /**
     * @dev Validate a UserOperation and determine if it should be sponsored
     * @param userOp The UserOperation to validate
     * @param maxCost Maximum cost for this operation
     * @return context Validation context (empty if valid)
     * @return validationData Validation result (0 = valid)
     */
    function _validatePaymasterUserOp(
        UserOperation calldata userOp,
        bytes32 /* userOpHash */,
        uint256 maxCost
    ) internal view override returns (bytes memory context, uint256 validationData) {
        // Check if sender is whitelisted
        if (!whitelist[userOp.sender]) {
            return ("", _packValidationData(true, 0, 0)); // Validation failed
        }

        // Check if cost is within acceptable range
        if (maxCost > maxCostPerUserOp) {
            return ("", _packValidationData(true, 0, 0)); // Validation failed
        }

        // Check if paymaster has sufficient deposit
        uint256 paymasterDeposit = entryPoint.balanceOf(address(this));
        if (paymasterDeposit < maxCost) {
            return ("", _packValidationData(true, 0, 0)); // Validation failed
        }

        // Validation successful
        context = abi.encode(userOp.sender, maxCost);
        validationData = 0; // Success
    }

    /**
     * @dev Post-operation hook called after UserOperation execution
     * @param context Context data from validation phase
     * @param actualGasCost Actual gas cost of the operation
     */
    function _postOp(
        PostOpMode /* mode */,
        bytes calldata context,
        uint256 actualGasCost
    ) internal override {
        if (context.length > 0) {
            (address sender, ) = abi.decode(context, (address, uint256));
            
            // Emit event for tracking
            emit UserOpSponsored(sender, actualGasCost);
            
            // Additional post-operation logic can be added here
            // For example: updating user quotas, logging, etc.
        }
    }

    /**
     * @dev Get the current deposit balance of this paymaster in EntryPoint
     * @return The deposit balance in wei
     */
    function getDepositBalance() external view returns (uint256) {
        return entryPoint.balanceOf(address(this));
    }

    /**
     * @dev Check if a user is whitelisted
     * @param user The user address to check
     * @return True if user is whitelisted
     */
    function isWhitelisted(address user) external view returns (bool) {
        return whitelist[user];
    }

    /**
     * @dev Emergency function to receive ETH
     */
    receive() external payable {
        // Allow contract to receive ETH
    }
}