import { expect } from "chai";
import { ethers } from "hardhat";
import { SimpleAccount, SimpleAccountFactory, TestToken, IEntryPoint } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("SimpleAccount - Batch Operations", function () {
  let simpleAccountFactory: SimpleAccountFactory;
  let simpleAccount: SimpleAccount;
  let testToken: TestToken;
  let entryPoint: IEntryPoint;
  let owner: SignerWithAddress;
  let recipient1: SignerWithAddress;
  let recipient2: SignerWithAddress;
  let recipient3: SignerWithAddress;

  const ENTRYPOINT_ADDRESS = "0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789";

  beforeEach(async function () {
    [owner, recipient1, recipient2, recipient3] = await ethers.getSigners();

    // Get EntryPoint interface
    entryPoint = await ethers.getContractAt("IEntryPoint", ENTRYPOINT_ADDRESS);

    // Deploy Factory
    const SimpleAccountFactoryFactory = await ethers.getContractFactory("SimpleAccountFactory");
    simpleAccountFactory = await SimpleAccountFactoryFactory.deploy(ENTRYPOINT_ADDRESS);
    await simpleAccountFactory.waitForDeployment();

    // Create SimpleAccount
    await simpleAccountFactory.createAccount(owner.address, 0);
    const accountAddress = await simpleAccountFactory.getAddress(owner.address, 0);
    simpleAccount = await ethers.getContractAt(
      "contracts/core/SimpleAccount.sol:SimpleAccount",
      accountAddress
    ) as unknown as SimpleAccount;

    // Deploy TestToken
    const TestTokenFactory = await ethers.getContractFactory("TestToken");
    testToken = await TestTokenFactory.deploy("Test Token", "TEST", owner.address);
    await testToken.waitForDeployment();

    // Mint tokens to SimpleAccount
    await testToken.freeMint(accountAddress, ethers.parseEther("1000"));
  });

  describe("executeBatch", function () {
    it("Should execute batch transfer to multiple recipients", async function () {
      const recipients = [recipient1.address, recipient2.address, recipient3.address];
      const amounts = [
        ethers.parseEther("50"),
        ethers.parseEther("75"),
        ethers.parseEther("100"),
      ];

      // Prepare batch data
      const destinations: string[] = [];
      const values: number[] = [];
      const callDatas: string[] = [];

      for (let i = 0; i < recipients.length; i++) {
        destinations.push(await testToken.getAddress());
        values.push(0);
        callDatas.push(
          testToken.interface.encodeFunctionData("transfer", [recipients[i], amounts[i]])
        );
      }

      // Execute batch
      await (simpleAccount.connect(owner) as any).executeBatch(destinations, values, callDatas);

      // Verify balances
      expect(await testToken.balanceOf(recipient1.address)).to.equal(amounts[0]);
      expect(await testToken.balanceOf(recipient2.address)).to.equal(amounts[1]);
      expect(await testToken.balanceOf(recipient3.address)).to.equal(amounts[2]);

      const totalTransferred = amounts.reduce((a, b) => a + b, 0n);
      expect(await testToken.balanceOf(await simpleAccount.getAddress())).to.equal(
        ethers.parseEther("1000") - totalTransferred
      );
    });

    it("Should execute batch with mixed operations", async function () {
      const tokenAddress = await testToken.getAddress();
      
      const destinations = [tokenAddress, tokenAddress];
      const values = [0n, 0n];
      const callDatas = [
        testToken.interface.encodeFunctionData("transfer", [
          recipient1.address,
          ethers.parseEther("100"),
        ]),
        testToken.interface.encodeFunctionData("approve", [
          recipient2.address,
          ethers.parseEther("200"),
        ]),
      ];

      await (simpleAccount.connect(owner) as any).executeBatch(destinations, values, callDatas);

      expect(await testToken.balanceOf(recipient1.address)).to.equal(ethers.parseEther("100"));
      expect(await testToken.allowance(await simpleAccount.getAddress(), recipient2.address)).to.equal(
        ethers.parseEther("200")
      );
    });

    it("Should revert if arrays have different lengths", async function () {
      const destinations = [await testToken.getAddress()];
      const values = [0n, 0n]; // Wrong length
      const callDatas = [
        testToken.interface.encodeFunctionData("transfer", [recipient1.address, 100]),
      ];

      await expect(
        (simpleAccount.connect(owner) as any).executeBatch(destinations, values, callDatas)
      ).to.be.revertedWith("SimpleAccount: wrong array lengths");
    });

    it("Should revert if arrays are empty", async function () {
      const destinations: string[] = [];
      const values: bigint[] = [];
      const callDatas: string[] = [];

      await expect(
        (simpleAccount.connect(owner) as any).executeBatch(destinations, values, callDatas)
      ).to.be.revertedWith("SimpleAccount: empty arrays");
    });

    it("Should revert if not called by owner or EntryPoint", async function () {
      const destinations = [await testToken.getAddress()];
      const values = [0n];
      const callDatas = [
        testToken.interface.encodeFunctionData("transfer", [
          recipient1.address,
          ethers.parseEther("100"),
        ]),
      ];

      await expect(
        (simpleAccount.connect(recipient1) as any).executeBatch(destinations, values, callDatas)
      ).to.be.revertedWithCustomError(simpleAccount, "NotFromEntryPointOrOwner");
    });

    it("Should execute large batch operation", async function () {
      // Create 10 recipients
      const numRecipients = 10;
      const destinations: string[] = [];
      const values: bigint[] = [];
      const callDatas: string[] = [];
      const recipients: string[] = [];
      const amount = ethers.parseEther("10");

      for (let i = 0; i < numRecipients; i++) {
        const recipient = ethers.Wallet.createRandom().address;
        recipients.push(recipient);
        destinations.push(await testToken.getAddress());
        values.push(0n);
        callDatas.push(
          testToken.interface.encodeFunctionData("transfer", [recipient, amount])
        );
      }

      await (simpleAccount.connect(owner) as any).executeBatch(destinations, values, callDatas);

      // Verify all transfers
      for (const recipient of recipients) {
        expect(await testToken.balanceOf(recipient)).to.equal(amount);
      }
    });

    it("Should handle failed transaction in batch", async function () {
      const destinations = [await testToken.getAddress()];
      const values = [0n];
      // Try to transfer more than available balance
      const callDatas = [
        testToken.interface.encodeFunctionData("transfer", [
          recipient1.address,
          ethers.parseEther("10000"), // More than balance
        ]),
      ];

      await expect(
        (simpleAccount.connect(owner) as any).executeBatch(destinations, values, callDatas)
      ).to.be.reverted;
    });

    it("Should execute batch with ETH transfers", async function () {
      // Fund the SimpleAccount with ETH
      await owner.sendTransaction({
        to: await simpleAccount.getAddress(),
        value: ethers.parseEther("1"),
      });

      const destinations = [recipient1.address, recipient2.address];
      const values = [ethers.parseEther("0.1"), ethers.parseEther("0.2")];
      const callDatas = ["0x", "0x"]; // Empty calldata for ETH transfer

      const initialBalance1 = await ethers.provider.getBalance(recipient1.address);
      const initialBalance2 = await ethers.provider.getBalance(recipient2.address);

      await (simpleAccount.connect(owner) as any).executeBatch(destinations, values, callDatas);

      const finalBalance1 = await ethers.provider.getBalance(recipient1.address);
      const finalBalance2 = await ethers.provider.getBalance(recipient2.address);

      expect(finalBalance1 - initialBalance1).to.equal(values[0]);
      expect(finalBalance2 - initialBalance2).to.equal(values[1]);
    });

    it("Should emit proper events for batch operations", async function () {
      const destinations = [await testToken.getAddress()];
      const values = [0n];
      const callDatas = [
        testToken.interface.encodeFunctionData("transfer", [
          recipient1.address,
          ethers.parseEther("100"),
        ]),
      ];

      // The batch execution should trigger Transfer event from token
      await expect((simpleAccount.connect(owner) as any).executeBatch(destinations, values, callDatas))
        .to.emit(testToken, "Transfer")
        .withArgs(await simpleAccount.getAddress(), recipient1.address, ethers.parseEther("100"));
    });

    it("Should handle batch with different tokens", async function () {
      // Deploy second token
      const TestTokenFactory = await ethers.getContractFactory("TestToken");
      const testToken2 = await TestTokenFactory.deploy("Test Token 2", "TEST2", owner.address);
      await testToken2.waitForDeployment();
      await testToken2.freeMint(await simpleAccount.getAddress(), ethers.parseEther("500"));

      const destinations = [await testToken.getAddress(), await testToken2.getAddress()];
      const values = [0n, 0n];
      const callDatas = [
        testToken.interface.encodeFunctionData("transfer", [
          recipient1.address,
          ethers.parseEther("100"),
        ]),
        testToken2.interface.encodeFunctionData("transfer", [
          recipient2.address,
          ethers.parseEther("200"),
        ]),
      ];

      await (simpleAccount.connect(owner) as any).executeBatch(destinations, values, callDatas);

      expect(await testToken.balanceOf(recipient1.address)).to.equal(ethers.parseEther("100"));
      expect(await testToken2.balanceOf(recipient2.address)).to.equal(ethers.parseEther("200"));
    });
  });

  describe("getExecuteBatchCallData", function () {
    it("Should return correct calldata for batch execution", async function () {
      const destinations = [await testToken.getAddress()];
      const values = [0n];
      const callDatas = [
        testToken.interface.encodeFunctionData("transfer", [
          recipient1.address,
          ethers.parseEther("100"),
        ]),
      ];

      const callData = await (simpleAccount as any).getExecuteBatchCallData(
        destinations,
        values,
        callDatas
      );

      expect(callData).to.be.a("string");
      expect(callData).to.include("0x"); // Should be valid hex
    });
  });

  describe("Gas optimization comparison", function () {
    it("Should use less gas than multiple single transactions", async function () {
      const recipients = [recipient1.address, recipient2.address, recipient3.address];
      const amounts = [
        ethers.parseEther("50"),
        ethers.parseEther("75"),
        ethers.parseEther("100"),
      ];

      // Measure gas for batch operation
      const destinations: string[] = [];
      const values: bigint[] = [];
      const callDatas: string[] = [];

      for (let i = 0; i < recipients.length; i++) {
        destinations.push(await testToken.getAddress());
        values.push(0n);
        callDatas.push(
          testToken.interface.encodeFunctionData("transfer", [recipients[i], amounts[i]])
        );
      }

      const batchTx = await (simpleAccount
        .connect(owner) as any)
        .executeBatch(destinations, values, callDatas);
      const batchReceipt = await batchTx.wait();
      const batchGasUsed = batchReceipt?.gasUsed || 0n;

      console.log(`      Batch gas used: ${batchGasUsed}`);

      // Measure gas for individual transactions
      let totalSingleGas = 0n;
      for (let i = 0; i < recipients.length; i++) {
        const singleTx = await simpleAccount
          .connect(owner)
          .execute(
            await testToken.getAddress(),
            0,
            testToken.interface.encodeFunctionData("transfer", [
              ethers.Wallet.createRandom().address,
              amounts[i],
            ])
          );
        const singleReceipt = await singleTx.wait();
        totalSingleGas += singleReceipt?.gasUsed || 0n;
      }

      console.log(`      Individual txs total gas: ${totalSingleGas}`);

      // Batch should use less gas than sum of individual transactions
      expect(batchGasUsed).to.be.lessThan(totalSingleGas);

      const gasSaved = totalSingleGas - batchGasUsed;
      const percentSaved = Number((gasSaved * 100n) / totalSingleGas);
      console.log(`      Gas saved: ${gasSaved} (${percentSaved.toFixed(1)}%)`);
    });
  });
});
