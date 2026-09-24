// Demo xác minh file thật trên Hardhat local network (dùng Registry/NFT giả lập).
//
//   npx hardhat run scripts/demo-verify.js
//   FILE=duong/dan/anh.png TAMPERED=duong/dan/anh-da-sua.png npx hardhat run scripts/demo-verify.js
//
// Không truyền FILE thì script tự tạo dữ liệu mẫu.
const fs = require("fs");
const { ethers } = require("hardhat");

const STATUS = ["None", "Active", "Disputed", "Revoked"];

function hashFile(path, fallbackText) {
  const bytes = path ? fs.readFileSync(path) : Buffer.from(fallbackText);
  return ethers.sha256(bytes); // cùng thuật toán với crypto.subtle.digest("SHA-256") ở trình duyệt
}

function print(label, hash, r) {
  console.log(`\n[${label}] SHA-256 = ${hash}`);
  if (!r.found) {
    console.log("  => KHÔNG TÌM THẤY trên chain (chuyển sang lớp 2: pHash off-chain)");
    return;
  }
  console.log("  => KHỚP CHÍNH XÁC");
  console.log(`     Artwork ID : ${r.artworkId}`);
  console.log(`     Creator    : ${r.creator}`);
  console.log(`     Đăng ký lúc: ${new Date(Number(r.registeredAt) * 1000).toISOString()}`);
  console.log(`     Trạng thái : ${STATUS[Number(r.status)]}`);
  console.log(`     Chủ sở hữu : ${r.minted ? r.currentOwner : "(chưa mint)"}`);
  console.log(`     Metadata   : ${r.metadataURI}`);
}

async function main() {
  const [artist, buyer] = await ethers.getSigners();

  const registry = await ethers.deployContract("MockArtworkRegistry");
  const nft = await ethers.deployContract("MockArtNFT");
  const verifier = await ethers.deployContract("ArtworkVerifier", [registry, nft]);
  console.log("ArtworkVerifier:", await verifier.getAddress());

  const original = hashFile(process.env.FILE, "Sunset in Da Nang - original");
  const tampered = hashFile(process.env.TAMPERED, "Sunset in Da Nang - edited");

  // Artist đăng ký + mint, rồi bán cho buyer
  await registry.connect(artist).register(original, "ipfs://demo-metadata");
  await registry.setMinted(1);
  await nft.mint(artist.address, 1);
  await nft.connect(artist).transferFrom(artist.address, buyer.address, 1);

  print("File gốc", original, await verifier.verifyArtwork(original));
  print("File đã sửa", tampered, await verifier.verifyArtwork(tampered));

  console.log("\nKiểm tra quyền:");
  console.log("  getOwner(1)          =", await verifier.getOwner(1));
  console.log("  isOwner(1, artist)   =", await verifier.isOwner(1, artist.address));
  console.log("  isOwner(1, buyer)    =", await verifier.isOwner(1, buyer.address));
  console.log("  getStatus(1)         =", STATUS[Number(await verifier.getStatus(1))]);
  await registry.setStatus(1, 2);
  console.log("  getStatus(1) sau khiếu nại =", STATUS[Number(await verifier.getStatus(1))]);
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
