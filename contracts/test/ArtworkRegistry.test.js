const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("ArtworkRegistry", function () {
  let registry;
  let admin, artist1, artist2, other;

  // Dữ liệu test
  const HASH_1 = ethers.id("artwork-file-1"); // bytes32
  const HASH_2 = ethers.id("artwork-file-2");
  const HASH_3 = ethers.id("artwork-file-3");
  const URI_1 = "ipfs://QmTest1111111111111111111111111111111111111111";
  const URI_2 = "ipfs://QmTest2222222222222222222222222222222222222222";
  const URI_3 = "ipfs://QmTest3333333333333333333333333333333333333333";
  const ZERO_HASH = ethers.ZeroHash;

  beforeEach(async function () {
    [admin, artist1, artist2, other] = await ethers.getSigners();
    const Factory = await ethers.getContractFactory("ArtworkRegistry");
    registry = await Factory.deploy();
  });

  // ==================================================================
  // 1. Đăng ký tác phẩm – registerArtwork()
  // ==================================================================

  describe("registerArtwork", function () {
    it("TC01 – Đăng ký tác phẩm thành công, trả về artworkId = 1", async function () {
      const tx = await registry.connect(artist1).registerArtwork(HASH_1, URI_1);
      const receipt = await tx.wait();

      // Kiểm tra event
      const event = receipt.logs.find(
        (log) => registry.interface.parseLog(log)?.name === "ArtworkRegistered"
      );
      const parsed = registry.interface.parseLog(event);
      expect(parsed.args.artworkId).to.equal(1n);
      expect(parsed.args.creator).to.equal(artist1.address);
      expect(parsed.args.contentHash).to.equal(HASH_1);
    });

    it("TC02 – artworkId tự tăng (1, 2, 3, ...)", async function () {
      await registry.connect(artist1).registerArtwork(HASH_1, URI_1);
      await registry.connect(artist2).registerArtwork(HASH_2, URI_2);
      await registry.connect(artist1).registerArtwork(HASH_3, URI_3);

      expect(await registry.totalArtworks()).to.equal(3n);
    });

    it("TC03 – Revert khi contentHash = bytes32(0)", async function () {
      await expect(
        registry.connect(artist1).registerArtwork(ZERO_HASH, URI_1)
      ).to.be.revertedWithCustomError(registry, "EmptyHash");
    });

    it("TC04 – Revert khi metadataURI rỗng", async function () {
      await expect(
        registry.connect(artist1).registerArtwork(HASH_1, "")
      ).to.be.revertedWithCustomError(registry, "EmptyMetadataURI");
    });

    it("TC05 – Revert khi hash đã được đăng ký trước đó", async function () {
      await registry.connect(artist1).registerArtwork(HASH_1, URI_1);

      await expect(
        registry.connect(artist2).registerArtwork(HASH_1, URI_2)
      ).to.be.revertedWithCustomError(registry, "HashAlreadyRegistered");
    });

    it("TC06 – Struct Artwork lưu đúng dữ liệu", async function () {
      await registry.connect(artist1).registerArtwork(HASH_1, URI_1);
      const a = await registry.getArtwork(1);

      expect(a.contentHash).to.equal(HASH_1);
      expect(a.creator).to.equal(artist1.address);
      expect(a.registeredAt).to.be.greaterThan(0n);
      expect(a.status).to.equal(1n); // Status.Active
      expect(a.minted).to.equal(false);
      expect(a.metadataURI).to.equal(URI_1);
    });
  });

  // ==================================================================
  // 2. Tra cứu – getArtworkByHash, getArtwork, getArtworksByCreator
  // ==================================================================

  describe("Tra cứu", function () {
    beforeEach(async function () {
      await registry.connect(artist1).registerArtwork(HASH_1, URI_1);
      await registry.connect(artist2).registerArtwork(HASH_2, URI_2);
    });

    it("TC07 – getArtworkByHash trả về đúng artworkId và struct", async function () {
      const [id, artwork] = await registry.getArtworkByHash(HASH_1);
      expect(id).to.equal(1n);
      expect(artwork.creator).to.equal(artist1.address);
    });

    it("TC08 – getArtworkByHash trả về id=0 khi hash chưa đăng ký", async function () {
      const unknownHash = ethers.id("not-registered");
      const [id, artwork] = await registry.getArtworkByHash(unknownHash);
      expect(id).to.equal(0n);
      expect(artwork.creator).to.equal(ethers.ZeroAddress);
    });

    it("TC09 – getArtwork trả struct rỗng khi id không tồn tại", async function () {
      const artwork = await registry.getArtwork(999);
      expect(artwork.creator).to.equal(ethers.ZeroAddress);
    });

    it("TC10 – getArtworksByCreator trả đúng danh sách", async function () {
      await registry.connect(artist1).registerArtwork(HASH_3, URI_3);
      const ids = await registry.getArtworksByCreator(artist1.address);
      expect(ids.length).to.equal(2);
      expect(ids[0]).to.equal(1n);
      expect(ids[1]).to.equal(3n);
    });

    it("TC11 – totalArtworks trả đúng số lượng", async function () {
      expect(await registry.totalArtworks()).to.equal(2n);
    });
  });

  // ==================================================================
  // 3. Quản lý trạng thái – setArtworkStatus
  // ==================================================================

  describe("setArtworkStatus", function () {
    beforeEach(async function () {
      await registry.connect(artist1).registerArtwork(HASH_1, URI_1);
    });

    it("TC12 – Admin chuyển Active → Disputed thành công", async function () {
      await expect(registry.setArtworkStatus(1, 2)) // 2 = Disputed
        .to.emit(registry, "ArtworkStatusChanged")
        .withArgs(1n, 1n, 2n); // Active(1) → Disputed(2)

      const a = await registry.getArtwork(1);
      expect(a.status).to.equal(2n);
    });

    it("TC13 – Revert khi không phải admin", async function () {
      await expect(
        registry.connect(other).setArtworkStatus(1, 2)
      ).to.be.revertedWithCustomError(registry, "NotAdmin");
    });

    it("TC14 – Revert khi chuyển từ Revoked (trạng thái cuối)", async function () {
      await registry.setArtworkStatus(1, 3); // Active → Revoked
      await expect(
        registry.setArtworkStatus(1, 1) // Revoked → Active ✗
      ).to.be.revertedWithCustomError(registry, "InvalidStatusTransition");
    });

    it("TC15 – Revert khi artwork không tồn tại", async function () {
      await expect(
        registry.setArtworkStatus(999, 2)
      ).to.be.revertedWithCustomError(registry, "ArtworkNotFound");
    });
  });

  // ==================================================================
  // 4. Đánh dấu đã mint – setMinted
  // ==================================================================

  describe("setMinted", function () {
    beforeEach(async function () {
      await registry.connect(artist1).registerArtwork(HASH_1, URI_1);
    });

    it("TC16 – setMinted thành công, emit ArtworkMinted", async function () {
      await expect(registry.setMinted(1))
        .to.emit(registry, "ArtworkMinted")
        .withArgs(1n);

      const a = await registry.getArtwork(1);
      expect(a.minted).to.equal(true);
    });

    it("TC17 – Revert khi đã minted rồi", async function () {
      await registry.setMinted(1);
      await expect(
        registry.setMinted(1)
      ).to.be.revertedWithCustomError(registry, "AlreadyMinted");
    });

    it("TC18 – Revert khi không phải admin", async function () {
      await expect(
        registry.connect(other).setMinted(1)
      ).to.be.revertedWithCustomError(registry, "NotAdmin");
    });
  });

  // ==================================================================
  // 5. Tích hợp với ArtworkVerifier (của Hoàng Sen)
  // ==================================================================

  describe("Tích hợp ArtworkRegistry + ArtworkVerifier", function () {
    let verifier, mockNFT;

    beforeEach(async function () {
      // Đăng ký 1 tác phẩm
      await registry.connect(artist1).registerArtwork(HASH_1, URI_1);

      // Deploy MockArtNFT
      const NFTFactory = await ethers.getContractFactory("MockArtNFT");
      mockNFT = await NFTFactory.deploy();

      // Deploy ArtworkVerifier trỏ vào registry thật
      const VerifierFactory = await ethers.getContractFactory("ArtworkVerifier");
      verifier = await VerifierFactory.deploy(
        await registry.getAddress(),
        await mockNFT.getAddress()
      );
    });

    it("TC19 – Verifier đọc được tác phẩm đã đăng ký qua Registry", async function () {
      const report = await verifier.verifyArtwork(HASH_1);
      expect(report.found).to.equal(true);
      expect(report.artworkId).to.equal(1n);
      expect(report.creator).to.equal(artist1.address);
      expect(report.status).to.equal(1n); // Active
      expect(report.metadataURI).to.equal(URI_1);
    });

    it("TC20 – Verifier trả found=false cho hash chưa đăng ký", async function () {
      const unknownHash = ethers.id("unknown-file");
      const report = await verifier.verifyArtwork(unknownHash);
      expect(report.found).to.equal(false);
      expect(report.artworkId).to.equal(0n);
    });

    it("TC21 – verifyArtworkById khớp đúng hash", async function () {
      expect(await verifier.verifyArtworkById(1, HASH_1)).to.equal(true);
      expect(await verifier.verifyArtworkById(1, HASH_2)).to.equal(false);
    });
  });
});
