// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "@account-abstraction/contracts/samples/SimpleAccount.sol" as AASimpleAccount;
import "@account-abstraction/contracts/interfaces/IEntryPoint.sol";

/**
 * @title SimpleAccount
 * @dev Account Abstraction wallet contract inheriting from AA reference implementation
 * @notice This contract represents a user's smart contract wallet for ERC-4337
 */
contract SimpleAccount is AASimpleAccount.SimpleAccount {
    /**
     * @dev Constructor for SimpleAccount
     * @param anEntryPoint The EntryPoint contract address
     */
    constructor(IEntryPoint anEntryPoint) AASimpleAccount.SimpleAccount(anEntryPoint) {
        // Constructor calls parent SimpleAccount constructor
        // All functionality inherited from @account-abstraction/contracts/samples/SimpleAccount.sol
    }

    /**
     * @dev Initialize the account with an owner
     * @param anOwner The owner address for this account
     * @notice This function should be called once during account creation
     */
    function initialize(address anOwner) public virtual override initializer {
        super.initialize(anOwner);
    }

    /**
     * @dev Get the current nonce for this account
     * @return The current nonce value
     */
    function getNonce() public view override returns (uint256) {
        return entryPoint().getNonce(address(this), 0);
    }

    /**
     * @dev Check if this account has been initialized
     * @return true if initialized, false otherwise
     */
    function isInitialized() public view returns (bool) {
        return owner != address(0);
    }

    /**
     * @dev Execute a batch of transactions
     * @param dest Array of destination addresses
     * @param value Array of ETH amounts to send
     * @param func Array of function call data
     * @notice All arrays must have the same length
     * @notice Only callable by the EntryPoint or the owner
     */
    function executeBatch(
        address[] calldata dest,
        uint256[] calldata value,
        bytes[] calldata func
    ) external {
        _requireFromEntryPointOrOwner();
        require(dest.length == value.length && value.length == func.length, "SimpleAccount: wrong array lengths");
        require(dest.length > 0, "SimpleAccount: empty arrays");
        
        for (uint256 i = 0; i < dest.length; i++) {
            _call(dest[i], value[i], func[i]);
        }
    }

    /**
     * @dev Get batch execution call data
     * @param dest Array of destination addresses
     * @param value Array of ETH amounts to send
     * @param func Array of function call data
     * @return Encoded executeBatch call data
     */
    function getExecuteBatchCallData(
        address[] calldata dest,
        uint256[] calldata value,
        bytes[] calldata func
    ) external pure returns (bytes memory) {
        return abi.encodeWithSignature(
            "executeBatch(address[],uint256[],bytes[])",
            dest,
            value,
            func
        );
    }
}