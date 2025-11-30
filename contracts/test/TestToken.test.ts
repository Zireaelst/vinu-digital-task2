import { expect } from "chai";
import { ethers } from "hardhat";
import { TestToken } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("TestToken", function () {
  let testToken: TestToken;
  let owner: SignerWithAddress;
  let user1: SignerWithAddress;
  let user2: SignerWithAddress;

  const INITIAL_SUPPLY = ethers.parseEther("10000000"); // 10M tokens
  const MAX_MINT = ethers.parseEther("1000000"); // 1M tokens

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();

    const TestTokenFactory = await ethers.getContractFactory("TestToken");
    testToken = await TestTokenFactory.deploy("Test Token", "TEST", owner.address);
    await testToken.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should set the correct name and symbol", async function () {
      expect(await testToken.name()).to.equal("Test Token");
      expect(await testToken.symbol()).to.equal("TEST");
    });

    it("Should mint initial supply to owner", async function () {
      const ownerBalance = await testToken.balanceOf(owner.address);
      expect(ownerBalance).to.equal(INITIAL_SUPPLY);
    });

    it("Should set the correct decimals", async function () {
      expect(await testToken.decimals()).to.equal(18);
    });

    it("Should set the correct owner", async function () {
      expect(await testToken.owner()).to.equal(owner.address);
    });
  });

  describe("FreeMint", function () {
    it("Should allow anyone to mint tokens", async function () {
      const mintAmount = ethers.parseEther("100");
      
      await testToken.connect(user1).freeMint(user2.address, mintAmount);
      
      expect(await testToken.balanceOf(user2.address)).to.equal(mintAmount);
    });

    it("Should emit FreeMint event", async function () {
      const mintAmount = ethers.parseEther("100");
      
      await expect(testToken.freeMint(user1.address, mintAmount))
        .to.emit(testToken, "FreeMint")
        .withArgs(user1.address, mintAmount);
    });

    it("Should revert when minting to zero address", async function () {
      const mintAmount = ethers.parseEther("100");
      
      await expect(
        testToken.freeMint(ethers.ZeroAddress, mintAmount)
      ).to.be.revertedWith("TestToken: mint to zero address");
    });

    it("Should revert when minting zero amount", async function () {
      await expect(
        testToken.freeMint(user1.address, 0)
      ).to.be.revertedWith("TestToken: mint amount must be positive");
    });

    it("Should revert when minting more than MAX_MINT_PER_CALL", async function () {
      const tooMuch = MAX_MINT + ethers.parseEther("1");
      
      await expect(
        testToken.freeMint(user1.address, tooMuch)
      ).to.be.revertedWith("TestToken: mint amount exceeds limit");
    });

    it("Should allow multiple mints up to limit", async function () {
      await testToken.freeMint(user1.address, MAX_MINT);
      await testToken.freeMint(user1.address, MAX_MINT);
      
      expect(await testToken.balanceOf(user1.address)).to.equal(MAX_MINT * 2n);
    });
  });

  describe("OwnerMint", function () {
    it("Should allow owner to mint tokens", async function () {
      const mintAmount = ethers.parseEther("5000000");
      
      await testToken.connect(owner).ownerMint(user1.address, mintAmount);
      
      expect(await testToken.balanceOf(user1.address)).to.equal(mintAmount);
    });

    it("Should allow owner to mint more than MAX_MINT_PER_CALL", async function () {
      const largeMint = MAX_MINT * 2n;
      
      await testToken.connect(owner).ownerMint(user1.address, largeMint);
      
      expect(await testToken.balanceOf(user1.address)).to.equal(largeMint);
    });

    it("Should revert when non-owner tries to ownerMint", async function () {
      const mintAmount = ethers.parseEther("100");
      
      await expect(
        testToken.connect(user1).ownerMint(user2.address, mintAmount)
      ).to.be.revertedWithCustomError(testToken, "OwnableUnauthorizedAccount");
    });

    it("Should revert when minting to zero address", async function () {
      const mintAmount = ethers.parseEther("100");
      
      await expect(
        testToken.connect(owner).ownerMint(ethers.ZeroAddress, mintAmount)
      ).to.be.revertedWith("TestToken: mint to zero address");
    });
  });

  describe("Transfer", function () {
    it("Should transfer tokens between accounts", async function () {
      const transferAmount = ethers.parseEther("1000");
      
      await testToken.connect(owner).transfer(user1.address, transferAmount);
      expect(await testToken.balanceOf(user1.address)).to.equal(transferAmount);
      
      await testToken.connect(user1).transfer(user2.address, transferAmount);
      expect(await testToken.balanceOf(user2.address)).to.equal(transferAmount);
      expect(await testToken.balanceOf(user1.address)).to.equal(0);
    });

    it("Should fail when sender has insufficient balance", async function () {
      const transferAmount = ethers.parseEther("1000");
      
      await expect(
        testToken.connect(user1).transfer(user2.address, transferAmount)
      ).to.be.revertedWithCustomError(testToken, "ERC20InsufficientBalance");
    });
  });

  describe("Allowance & TransferFrom", function () {
    it("Should approve and transferFrom", async function () {
      const amount = ethers.parseEther("1000");
      
      await testToken.connect(owner).approve(user1.address, amount);
      expect(await testToken.allowance(owner.address, user1.address)).to.equal(amount);
      
      await testToken.connect(user1).transferFrom(owner.address, user2.address, amount);
      expect(await testToken.balanceOf(user2.address)).to.equal(amount);
    });
  });

  describe("Total Supply", function () {
    it("Should update total supply on mint", async function () {
      const initialSupply = await testToken.totalSupply();
      const mintAmount = ethers.parseEther("1000");
      
      await testToken.freeMint(user1.address, mintAmount);
      
      expect(await testToken.totalSupply()).to.equal(initialSupply + mintAmount);
    });
  });
});
