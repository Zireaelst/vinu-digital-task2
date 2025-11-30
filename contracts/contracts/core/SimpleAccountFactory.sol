// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "@openzeppelin/contracts/utils/Create2.sol";
import "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";
import "@account-abstraction/contracts/interfaces/IEntryPoint.sol";
import "./SimpleAccount.sol";

/**
 * @title SimpleAccountFactory
 * @dev Factory contract for creating SimpleAccount instances using CREATE2 for deterministic addresses
 * @notice This factory allows for counterfactual account creation in ERC-4337
 */
contract SimpleAccountFactory {
    SimpleAccount public immutable accountImplementation;
    IEntryPoint public immutable entryPoint;

    event AccountCreated(address indexed account, address indexed owner, uint256 salt);

    constructor(IEntryPoint _entryPoint) {
        entryPoint = _entryPoint;
        accountImplementation = new SimpleAccount(_entryPoint);
    }

    /**
     * @dev Create a new SimpleAccount using CREATE2
     * @param owner The owner address for the new account
     * @param salt A salt value for deterministic address generation
     * @return account The address of the created account
     */
    function createAccount(address owner, uint256 salt) public returns (SimpleAccount account) {
        address addr = getAddress(owner, salt);
        uint256 codeSize = addr.code.length;
        
        if (codeSize > 0) {
            return SimpleAccount(payable(addr));
        }
        
        bytes memory initializeCall = abi.encodeCall(SimpleAccount.initialize, (owner));
        
        account = SimpleAccount(payable(Create2.deploy(
            0,
            bytes32(salt),
            abi.encodePacked(
                type(ERC1967Proxy).creationCode,
                abi.encode(
                    address(accountImplementation),
                    initializeCall
                )
            )
        )));

        emit AccountCreated(address(account), owner, salt);
    }

    /**
     * @dev Calculate the counterfactual address of a SimpleAccount
     * @param owner The owner address for the account
     * @param salt The salt value for address generation
     * @return The calculated address
     */
    function getAddress(address owner, uint256 salt) public view returns (address) {
        bytes memory initializeCall = abi.encodeCall(SimpleAccount.initialize, (owner));
        
        return Create2.computeAddress(
            bytes32(salt),
            keccak256(abi.encodePacked(
                type(ERC1967Proxy).creationCode,
                abi.encode(
                    address(accountImplementation),
                    initializeCall
                )
            ))
        );
    }

    /**
     * @dev Get the address of the account implementation
     * @return The implementation contract address
     */
    function getImplementation() public view returns (address) {
        return address(accountImplementation);
    }

    /**
     * @dev Get the EntryPoint address
     * @return The EntryPoint contract address
     */
    function getEntryPoint() public view returns (address) {
        return address(entryPoint);
    }
}