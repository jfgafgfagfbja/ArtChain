const { expect } = require("chai");
const { ethers } = require("hardhat");
const { loadFixture } = require("@nomicfoundation/hardhat-toolbox/network-helpers");

const Status = { None: 0n, Active: 1n, Disputed: 2n, Revoked: 3n };
const sha256 = (text) => ethers.sha256(ethers.toUtf8Bytes(text));

describe("ArtworkVerifier", function () {
  async function deployFixture() {
    const [artist, buyer, stranger] = await ethers.getSigners();

    const registry = await ethers.deployContract("MockArtworkRegistry");
    const nft = await ethers.deployContract("MockArtNFT");
    const verifier = await ethers.deployContract("ArtworkVerifier", [registry, nft]);

    // Tác phẩm #1: đã đăng ký và mint cho artist
    const hash1 = sha256("Sunset in Da Nang - original file");
    await registry.connect(artist).register(hash1, "ipfs://meta-1");
    await registry.setMinted(1);
    await nft.mint(artist.address, 1);

    // Tác phẩm #2: đã đăng ký, chưa mint
    const hash2 = sha256("Hoi An lanterns - original file");
    await registry.connect(artist).register(hash2, "ipfs://meta-2");

    return { registry, nft, verifier, artist, buyer, stranger, hash1, hash2 };
  }

  describe("deploy", function () {
    it("lưu địa chỉ Registry và NFT", async function () {
      const { registry, nft, verifier } = await loadFixture(deployFixture);
      expect(await verifier.registry()).to.equal(await registry.getAddress());
      expect(await verifier.nft()).to.equal(await nft.getAddress());
    });

    it("từ chối địa chỉ 0", async function () {
      const { nft } = await loadFixture(deployFixture);
      const Verifier = await ethers.getContractFactory("ArtworkVerifier");
      await expect(Verifier.deploy(ethers.ZeroAddress, nft)).to.be.revertedWithCustomError(Verifier, "ZeroAddress");
    });
  });

  describe("verifyArtwork(hash)", function () {
    it("KHỚP: file gốc trả về đầy đủ nguồn gốc và chủ sở hữu", async function () {
      const { verifier, artist, hash1 } = await loadFixture(deployFixture);
      const r = await verifier.verifyArtwork(hash1);
      expect(r.found).to.equal(true);
      expect(r.artworkId).to.equal(1n);
      expect(r.creator).to.equal(artist.address);
      expect(r.registeredAt).to.be.greaterThan(0n);
      expect(r.status).to.equal(Status.Active);
      expect(r.minted).to.equal(true);
      expect(r.currentOwner).to.equal(artist.address);
      expect(r.metadataURI).to.equal("ipfs://meta-1");
    });

    it("KHÔNG TÌM THẤY: file bị sửa (dù chỉ 1 ký tự) có hash khác", async function () {
      const { verifier } = await loadFixture(deployFixture);
      const r = await verifier.verifyArtwork(sha256("Sunset in Da Nang - original filE"));
      expect(r.found).to.equal(false);
      expect(r.artworkId).to.equal(0n);
      expect(r.creator).to.equal(ethers.ZeroAddress);
      expect(r.currentOwner).to.equal(ethers.ZeroAddress);
    });

    it("tác phẩm chưa mint: currentOwner = 0x0", async function () {
      const { verifier, hash2 } = await loadFixture(deployFixture);
      const r = await verifier.verifyArtwork(hash2);
      expect(r.found).to.equal(true);
      expect(r.minted).to.equal(false);
      expect(r.currentOwner).to.equal(ethers.ZeroAddress);
    });

    it("phản ánh chủ sở hữu mới sau khi chuyển nhượng", async function () {
      const { nft, verifier, artist, buyer, hash1 } = await loadFixture(deployFixture);
      await nft.connect(artist).transferFrom(artist.address, buyer.address, 1);
      const r = await verifier.verifyArtwork(hash1);
      expect(r.creator).to.equal(artist.address); // người đăng ký không đổi
      expect(r.currentOwner).to.equal(buyer.address);
    });

    it("tác phẩm bị khiếu nại vẫn KHỚP nhưng status = Disputed", async function () {
      const { registry, verifier, hash1 } = await loadFixture(deployFixture);
      await registry.setStatus(1, Status.Disputed);
      const r = await verifier.verifyArtwork(hash1);
      expect(r.found).to.equal(true);
      expect(r.status).to.equal(Status.Disputed);
    });
  });

  describe("verifyArtworkById(id, hash)", function () {
    it("true khi hash khớp đúng tác phẩm", async function () {
      const { verifier, hash1 } = await loadFixture(deployFixture);
      expect(await verifier.verifyArtworkById(1, hash1)).to.equal(true);
    });

    it("false khi hash thuộc tác phẩm khác", async function () {
      const { verifier, hash2 } = await loadFixture(deployFixture);
      expect(await verifier.verifyArtworkById(1, hash2)).to.equal(false);
    });

    it("false khi id không tồn tại (kể cả hash = 0x0)", async function () {
      const { verifier } = await loadFixture(deployFixture);
      expect(await verifier.verifyArtworkById(99, ethers.ZeroHash)).to.equal(false);
    });
  });

  describe("getOwner / isOwner", function () {
    it("trả về owner của token đã mint", async function () {
      const { verifier, artist } = await loadFixture(deployFixture);
      expect(await verifier.getOwner(1)).to.equal(artist.address);
    });

    it("trả về 0x0 (không revert) với token chưa mint", async function () {
      const { verifier } = await loadFixture(deployFixture);
      expect(await verifier.getOwner(2)).to.equal(ethers.ZeroAddress);
      expect(await verifier.getOwner(999)).to.equal(ethers.ZeroAddress);
    });

    it("isOwner đúng/sai theo ví", async function () {
      const { verifier, artist, stranger } = await loadFixture(deployFixture);
      expect(await verifier.isOwner(1, artist.address)).to.equal(true);
      expect(await verifier.isOwner(1, stranger.address)).to.equal(false);
    });

    it("isOwner(token chưa mint, 0x0) = false", async function () {
      const { verifier } = await loadFixture(deployFixture);
      expect(await verifier.isOwner(2, ethers.ZeroAddress)).to.equal(false);
    });
  });

  describe("getStatus / isActive", function () {
    it("None với tác phẩm chưa đăng ký", async function () {
      const { verifier } = await loadFixture(deployFixture);
      expect(await verifier.getStatus(99)).to.equal(Status.None);
      expect(await verifier.isActive(99)).to.equal(false);
    });

    it("theo dõi vòng đời Active → Disputed → Revoked", async function () {
      const { registry, verifier } = await loadFixture(deployFixture);
      expect(await verifier.getStatus(1)).to.equal(Status.Active);
      expect(await verifier.isActive(1)).to.equal(true);

      await registry.setStatus(1, Status.Disputed);
      expect(await verifier.getStatus(1)).to.equal(Status.Disputed);
      expect(await verifier.isActive(1)).to.equal(false);

      await registry.setStatus(1, Status.Revoked);
      expect(await verifier.getStatus(1)).to.equal(Status.Revoked);
    });
  });
});
