/**
 * Demo script: Đăng ký tác phẩm & xác minh trên mạng local
 * 
 * Chạy: npx hardhat run scripts/demo-register.js
 * 
 * Luồng demo:
 *   1. Deploy ArtworkRegistry
 *   2. Nghệ sĩ đăng ký tác phẩm (registerArtwork)
 *   3. Tra cứu tác phẩm theo hash (getArtworkByHash)
 *   4. Deploy ArtworkVerifier & xác minh (verifyArtwork)
 *   5. Thay đổi trạng thái (setArtworkStatus)
 * 
 * @author An Em (ArtChain PoC)
 */

const { ethers } = require("hardhat");

async function main() {
  const [deployer, artist] = await ethers.getSigners();

  console.log("╔══════════════════════════════════════════════════════════╗");
  console.log("║       ArtChain PoC – Demo Đăng ký Tác phẩm            ║");
  console.log("╚══════════════════════════════════════════════════════════╝\n");

  // ------------------------------------------------------------------
  // 1. Deploy contracts
  // ------------------------------------------------------------------
  console.log("📦 Deploy ArtworkRegistry...");
  const Registry = await ethers.getContractFactory("ArtworkRegistry");
  const registry = await Registry.deploy();
  console.log(`   ✅ ArtworkRegistry: ${await registry.getAddress()}\n`);

  console.log("📦 Deploy MockArtNFT...");
  const NFT = await ethers.getContractFactory("MockArtNFT");
  const nft = await NFT.deploy();
  console.log(`   ✅ MockArtNFT: ${await nft.getAddress()}\n`);

  console.log("📦 Deploy ArtworkVerifier...");
  const Verifier = await ethers.getContractFactory("ArtworkVerifier");
  const verifier = await Verifier.deploy(
    await registry.getAddress(),
    await nft.getAddress()
  );
  console.log(`   ✅ ArtworkVerifier: ${await verifier.getAddress()}\n`);

  // ------------------------------------------------------------------
  // 2. Nghệ sĩ đăng ký tác phẩm
  // ------------------------------------------------------------------
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("🎨 Bước 1: Nghệ sĩ đăng ký tác phẩm\n");

  // Giả lập tính SHA-256 của file ảnh
  const fileContent = "Hoang Hon Sai Gon - digital art file bytes...";
  const contentHash = ethers.id(fileContent); // keccak256 thay cho SHA-256 trong demo
  const metadataURI = "ipfs://QmExampleMetadataCID123456789";

  console.log(`   👤 Nghệ sĩ:     ${artist.address}`);
  console.log(`   🔑 Content Hash: ${contentHash}`);
  console.log(`   🔗 Metadata URI: ${metadataURI}\n`);

  const tx = await registry.connect(artist).registerArtwork(contentHash, metadataURI);
  const receipt = await tx.wait();

  // Parse event
  const event = receipt.logs.find(
    (log) => registry.interface.parseLog(log)?.name === "ArtworkRegistered"
  );
  const parsed = registry.interface.parseLog(event);
  const artworkId = parsed.args.artworkId;

  console.log(`   ✅ Đăng ký thành công!`);
  console.log(`   📝 Artwork ID: ${artworkId}`);
  console.log(`   ⛽ Gas used: ${receipt.gasUsed.toString()}\n`);

  // ------------------------------------------------------------------
  // 3. Tra cứu tác phẩm
  // ------------------------------------------------------------------
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("🔍 Bước 2: Tra cứu tác phẩm từ Registry\n");

  const artwork = await registry.getArtwork(artworkId);
  console.log(`   📄 Content Hash:  ${artwork.contentHash}`);
  console.log(`   👤 Creator:       ${artwork.creator}`);
  console.log(`   📅 Registered At: ${new Date(Number(artwork.registeredAt) * 1000).toLocaleString("vi-VN")}`);
  console.log(`   📊 Status:        ${["None", "Active", "Disputed", "Revoked"][Number(artwork.status)]}`);
  console.log(`   🎫 Minted:        ${artwork.minted}`);
  console.log(`   🔗 Metadata URI:  ${artwork.metadataURI}\n`);

  // ------------------------------------------------------------------
  // 4. Xác minh bằng ArtworkVerifier (tích hợp phần Hoàng Sen)
  // ------------------------------------------------------------------
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("🔎 Bước 3: Xác minh tác phẩm (ArtworkVerifier – Hoàng Sen)\n");

  const report = await verifier.verifyArtwork(contentHash);
  console.log(`   ✅ Found:         ${report.found}`);
  console.log(`   📝 Artwork ID:    ${report.artworkId}`);
  console.log(`   👤 Creator:       ${report.creator}`);
  console.log(`   📊 Status:        ${["None", "Active", "Disputed", "Revoked"][Number(report.status)]}`);
  console.log(`   🎫 Minted:        ${report.minted}`);
  console.log(`   👑 Current Owner: ${report.currentOwner}\n`);

  // Thử xác minh hash không tồn tại
  const fakeHash = ethers.id("fake-file-not-registered");
  const fakeReport = await verifier.verifyArtwork(fakeHash);
  console.log(`   ❌ Hash giả → found = ${fakeReport.found} (chuyển sang pHash lớp 2)\n`);

  // ------------------------------------------------------------------
  // 5. Admin thay đổi trạng thái
  // ------------------------------------------------------------------
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("⚙️  Bước 4: Admin thay đổi trạng thái tác phẩm\n");

  await registry.setArtworkStatus(artworkId, 2); // Active → Disputed
  let updated = await registry.getArtwork(artworkId);
  console.log(`   🔄 Active → Disputed: status = ${["None", "Active", "Disputed", "Revoked"][Number(updated.status)]}`);

  await registry.setArtworkStatus(artworkId, 1); // Disputed → Active (phục hồi)
  updated = await registry.getArtwork(artworkId);
  console.log(`   🔄 Disputed → Active: status = ${["None", "Active", "Disputed", "Revoked"][Number(updated.status)]}`);

  // ------------------------------------------------------------------
  // 6. Thống kê
  // ------------------------------------------------------------------
  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("📊 Thống kê\n");
  console.log(`   Tổng tác phẩm đã đăng ký: ${await registry.totalArtworks()}`);
  const creatorArtworks = await registry.getArtworksByCreator(artist.address);
  console.log(`   Tác phẩm của nghệ sĩ ${artist.address.slice(0, 10)}...: [${creatorArtworks.join(", ")}]`);

  console.log("\n╔══════════════════════════════════════════════════════════╗");
  console.log("║              ✅ Demo hoàn tất thành công!               ║");
  console.log("╚══════════════════════════════════════════════════════════╝\n");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
