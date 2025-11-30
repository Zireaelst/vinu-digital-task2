import { expect } from "chai";
import { ethers } from "hardhat";
import { SponsorPaymaster, IEntryPoint, TestToken } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("SponsorPaymaster", function () {
  let paymaster: SponsorPaymaster;
  let entryPoint: IEntryPoint;
  let owner: SignerWithAddress;
  let user1: SignerWithAddress;
  let user2: SignerWithAddress;

  const ENTRYPOINT_ADDRESS = "0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789";
  const MINIMUM_DEPOSIT = ethers.parseEther("0.01");

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();

    // Deploy Paymaster
    const SponsorPaymasterFactory = await ethers.getContractFactory("SponsorPaymaster");
    paymaster = await SponsorPaymasterFactory.deploy(ENTRYPOINT_ADDRESS, owner.address);
    await paymaster.waitForDeployment();

    // Get EntryPoint interface
    entryPoint = await ethers.getContractAt("IEntryPoint", ENTRYPOINT_ADDRESS);
  });

  describe("Deployment", function () {
    it("Should set the correct owner", async function () {
      expect(await paymaster.owner()).to.equal(owner.address);
    });

    it("Should set the correct EntryPoint", async function () {
      const paymasterEntryPoint = await paymaster.entryPoint();
      expect(paymasterEntryPoint).to.equal(ENTRYPOINT_ADDRESS);
    });

    it("Should set default maxCostPerUserOp", async function () {
      const maxCost = await paymaster.maxCostPerUserOp();
      expect(maxCost).to.equal(ethers.parseEther("0.005"));
    });
  });

  describe("Whitelist Management", function () {
    it("Should allow owner to whitelist users", async function () {
      await paymaster.connect(owner).setWhitelist(user1.address, true);
      expect(await paymaster.whitelist(user1.address)).to.be.true;
    });

    it("Should allow owner to remove users from whitelist", async function () {
      await paymaster.connect(owner).setWhitelist(user1.address, true);
      await paymaster.connect(owner).setWhitelist(user1.address, false);
      expect(await paymaster.whitelist(user1.address)).to.be.false;
    });

    it("Should emit UserWhitelisted event", async function () {
      await expect(paymaster.connect(owner).setWhitelist(user1.address, true))
        .to.emit(paymaster, "UserWhitelisted")
        .withArgs(user1.address, true);
    });

    it("Should revert when non-owner tries to whitelist", async function () {
      await expect(
        paymaster.connect(user1).setWhitelist(user2.address, true)
      ).to.be.revertedWithCustomError(paymaster, "OwnableUnauthorizedAccount");
    });

    it("Should check whitelist status correctly", async function () {
      expect(await paymaster.isWhitelisted(user1.address)).to.be.false;
      
      await paymaster.connect(owner).setWhitelist(user1.address, true);
      expect(await paymaster.isWhitelisted(user1.address)).to.be.true;
    });
  });

  describe("Deposit Management", function () {
    it("Should allow deposits for sponsor", async function () {
      const depositAmount = ethers.parseEther("0.1");
      
      await expect(
        paymaster.connect(user1).depositForSponsor({ value: depositAmount })
      ).to.emit(paymaster, "SponsorDeposited")
        .withArgs(user1.address, depositAmount);
      
      expect(await paymaster.sponsorDeposits(user1.address)).to.equal(depositAmount);
    });

    it("Should revert deposit less than minimum", async function () {
      const smallDeposit = ethers.parseEther("0.001");
      
      await expect(
        paymaster.connect(user1).depositForSponsor({ value: smallDeposit })
      ).to.be.revertedWith("SponsorPaymaster: deposit too small");
    });

    it("Should allow owner to deposit", async function () {
      const depositAmount = ethers.parseEther("0.1");
      
      await paymaster.connect(owner).depositForOwner({ value: depositAmount });
      
      const balance = await paymaster.getDepositBalance();
      expect(balance).to.be.gte(depositAmount);
    });

    it("Should revert owner deposit with zero value", async function () {
      await expect(
        paymaster.connect(owner).depositForOwner({ value: 0 })
      ).to.be.revertedWith("SponsorPaymaster: deposit must be positive");
    });

    it("Should accumulate multiple deposits", async function () {
      const depositAmount = ethers.parseEther("0.05");
      
      await paymaster.connect(user1).depositForSponsor({ value: depositAmount });
      await paymaster.connect(user1).depositForSponsor({ value: depositAmount });
      
      expect(await paymaster.sponsorDeposits(user1.address)).to.equal(depositAmount * 2n);
    });
  });

  describe("Withdrawal", function () {
    beforeEach(async function () {
      // Fund paymaster with deposit
      const depositAmount = ethers.parseEther("0.1");
      await paymaster.connect(owner).depositForOwner({ value: depositAmount });
    });

    it("Should allow owner to withdraw", async function () {
      const withdrawAmount = ethers.parseEther("0.01");
      const balanceBefore = await ethers.provider.getBalance(user2.address);
      
      await paymaster.connect(owner).withdrawDeposit(user2.address, withdrawAmount);
      
      const balanceAfter = await ethers.provider.getBalance(user2.address);
      expect(balanceAfter - balanceBefore).to.equal(withdrawAmount);
    });

    it("Should emit SponsorWithdrawn event", async function () {
      const withdrawAmount = ethers.parseEther("0.01");
      
      await expect(
        paymaster.connect(owner).withdrawDeposit(user2.address, withdrawAmount)
      ).to.emit(paymaster, "SponsorWithdrawn")
        .withArgs(user2.address, withdrawAmount);
    });

    it("Should revert when non-owner tries to withdraw", async function () {
      const withdrawAmount = ethers.parseEther("0.01");
      
      await expect(
        paymaster.connect(user1).withdrawDeposit(user2.address, withdrawAmount)
      ).to.be.revertedWithCustomError(paymaster, "OwnableUnauthorizedAccount");
    });
  });

  describe("MaxCost Configuration", function () {
    it("Should allow owner to set maxCostPerUserOp", async function () {
      const newMaxCost = ethers.parseEther("0.01");
      
      await paymaster.connect(owner).setMaxCostPerUserOp(newMaxCost);
      
      expect(await paymaster.maxCostPerUserOp()).to.equal(newMaxCost);
    });

    it("Should revert when non-owner tries to set maxCost", async function () {
      const newMaxCost = ethers.parseEther("0.01");
      
      await expect(
        paymaster.connect(user1).setMaxCostPerUserOp(newMaxCost)
      ).to.be.revertedWithCustomError(paymaster, "OwnableUnauthorizedAccount");
    });

    it("Should allow setting maxCost to zero", async function () {
      await paymaster.connect(owner).setMaxCostPerUserOp(0);
      expect(await paymaster.maxCostPerUserOp()).to.equal(0);
    });
  });

  describe("Deposit Balance Check", function () {
    it("Should return correct deposit balance", async function () {
      const depositAmount = ethers.parseEther("0.1");
      
      const balanceBefore = await paymaster.getDepositBalance();
      
      await paymaster.connect(owner).depositForOwner({ value: depositAmount });
      
      const balanceAfter = await paymaster.getDepositBalance();
      expect(balanceAfter - balanceBefore).to.equal(depositAmount);
    });

    it("Should start with zero balance for new deployment", async function () {
      const SponsorPaymasterFactory = await ethers.getContractFactory("SponsorPaymaster");
      const newPaymaster = await SponsorPaymasterFactory.deploy(ENTRYPOINT_ADDRESS, owner.address);
      await newPaymaster.waitForDeployment();
      
      expect(await newPaymaster.getDepositBalance()).to.equal(0);
    });
  });

  describe("Integration Tests", function () {
    it("Should support full workflow: whitelist, deposit, check", async function () {
      // 1. Whitelist user
      await paymaster.connect(owner).setWhitelist(user1.address, true);
      expect(await paymaster.isWhitelisted(user1.address)).to.be.true;
      
      // 2. Deposit funds
      const depositAmount = ethers.parseEther("0.1");
      await paymaster.connect(owner).depositForOwner({ value: depositAmount });
      
      // 3. Check balance
      const balance = await paymaster.getDepositBalance();
      expect(balance).to.be.gte(depositAmount);
    });
  });
});
