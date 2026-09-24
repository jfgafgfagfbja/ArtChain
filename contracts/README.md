# ArtChain – Smart Contracts

Hardhat 2 · Solidity 0.8.24 · OpenZeppelin 5.x

```bash
cd contracts
npm install
npx hardhat compile
npx hardhat test
npm run demo:verify
```

## Cấu trúc

| File | Nội dung | Phụ trách |
|---|---|---|
| `contracts/interfaces/IArtworkRegistry.sol` | Interface Registry mà các contract khác đọc | Thống nhất với người làm Registry |
| `contracts/ArtworkVerifier.sol` | Xác minh & kiểm tra quyền | Hoàng Sen |
| `contracts/mocks/*` | Registry/NFT giả lập **chỉ để test** | Hoàng Sen |
| `test/ArtworkVerifier.test.js` | 16 test cho ArtworkVerifier | Hoàng Sen |
| `scripts/demo-verify.js` | Demo xác minh file thật trên mạng local | Hoàng Sen |

## ArtworkVerifier – Xác minh & kiểm tra quyền

Mọi hàm đều là `view`: gọi miễn phí, không cần ví, không tạo giao dịch (đặc tả §10.6, UC08).

| Hàm | Trả về | Dùng để |
|---|---|---|
| `verifyArtwork(bytes32 hash)` | `VerificationReport { found, artworkId, creator, registeredAt, status, minted, currentOwner, metadataURI }` | Upload file → tính SHA-256 → tra nguồn gốc. `found = false` = **KHÔNG TÌM THẤY** (client chuyển sang pHash off-chain) |
| `verifyArtworkById(uint256 id, bytes32 hash)` | `bool` | Đối chiếu file tải về có đúng là tác phẩm `id` đang xem không |
| `getOwner(uint256 tokenId)` | `address` | Chủ sở hữu hiện tại; trả `0x0` nếu chưa mint (không revert như `ownerOf`) |
| `isOwner(uint256 tokenId, address account)` | `bool` | Kiểm tra quyền trước khi cho đăng bán/chuyển nhượng |
| `getStatus(uint256 artworkId)` | `Status` (0 None, 1 Active, 2 Disputed, 3 Revoked) | Trạng thái hiện tại của tác phẩm |
| `isActive(uint256 artworkId)` | `bool` | Có được mint/đăng bán/mua không |

### Gọi từ frontend (ethers v6)

```js
const buf = await file.arrayBuffer();
const hash = "0x" + [...new Uint8Array(await crypto.subtle.digest("SHA-256", buf))]
  .map((b) => b.toString(16).padStart(2, "0")).join("");
const r = await verifier.verifyArtwork(hash);
if (r.found) { /* KHỚP: hiển thị r.creator, r.currentOwner, r.status ... */ }
else         { /* gọi backend POST /verify/similar với pHash */ }
```

### Yêu cầu với các contract khác

- **ArtworkRegistry** phải implement `IArtworkRegistry` (`getArtworkByHash`, `getArtwork`) và dùng enum `Status { None, Active, Disputed, Revoked }` – `None` (= 0) là tác phẩm chưa đăng ký.
- **ArtNFT** là ERC-721 chuẩn với `tokenId = artworkId` (đặc tả §9.3).

Khi hai contract thật hoàn thành, chỉ cần deploy `ArtworkVerifier(registryAddress, nftAddress)` – không phải sửa code.
