# Luồng Người dùng – Tác phẩm – Metadata (PoC)

> Tài liệu mô tả luồng nghiệp vụ cho phần **Người dùng & Tác phẩm** – phụ trách bởi **An Em**.
> Tham chiếu: đặc tả §6 (Use Case), §8 (Dữ liệu), §9.2 (ArtworkRegistry), §10.6 (Xác minh 2 lớp).

---

## 1. Tổng quan luồng

```
Nghệ sĩ (User)
    │
    ▼
┌──────────────────────┐
│  1. Kết nối ví        │   MetaMask / WalletConnect
│     (Connect Wallet)  │   → lấy address làm định danh
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│  2. Chuẩn bị file     │   Client-side:
│     tác phẩm          │   - Tính SHA-256 (contentHash)
│                       │   - Upload file + metadata lên IPFS (Pinata)
│                       │   → nhận metadataURI = "ipfs://<CID>"
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│  3. Đăng ký tác phẩm  │   Gọi ArtworkRegistry.registerArtwork(
│     on-chain          │       contentHash, metadataURI
│                       │   )
│                       │   → Tạo bản ghi Artwork on-chain
│                       │   → Emit event ArtworkRegistered
│                       │   → Trạng thái: Active
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│  4. Xác minh          │   Bất kỳ ai gọi ArtworkVerifier.verifyArtwork(hash)
│     (Hoàng Sen đã     │   → Trả về VerificationReport
│      làm phần này)    │   → Nếu found=false → chuyển sang pHash (lớp 2)
└──────────────────────┘
```

## 2. Chi tiết từng bước

### Bước 1 – Kết nối ví (Connect Wallet)

| Hạng mục | Chi tiết |
|---|---|
| **Actor** | Nghệ sĩ (Artist) |
| **Hành động** | Nhấn nút "Connect Wallet" trên giao diện |
| **Kết quả** | Lấy `msg.sender` (address) làm định danh duy nhất của nghệ sĩ |
| **Lưu ý** | Không cần đăng ký tài khoản riêng – ví Ethereum chính là danh tính |

### Bước 2 – Chuẩn bị file tác phẩm

| Hạng mục | Chi tiết |
|---|---|
| **Input** | File ảnh/video gốc + thông tin tác phẩm (tên, mô tả, tag, ...) |
| **Xử lý client** | 1. Tính `SHA-256` của file → `contentHash` (bytes32) |
| | 2. Tạo JSON metadata theo chuẩn ERC-721 (xem mẫu ở mục 3) |
| | 3. Upload file gốc lên IPFS → `imageCID` |
| | 4. Upload metadata JSON lên IPFS → `metadataCID` |
| **Output** | `contentHash` (bytes32), `metadataURI` = `"ipfs://<metadataCID>"` |

### Bước 3 – Đăng ký tác phẩm on-chain

| Hạng mục | Chi tiết |
|---|---|
| **Contract** | `ArtworkRegistry.sol` |
| **Function** | `registerArtwork(bytes32 contentHash, string metadataURI)` |
| **Kiểm tra** | - `contentHash` chưa tồn tại (tránh đăng ký trùng) |
| | - `contentHash != bytes32(0)` |
| | - `metadataURI` không rỗng |
| **Kết quả** | - Tạo struct `Artwork` mới với `artworkId` tự tăng |
| | - `creator = msg.sender`, `status = Active`, `minted = false` |
| | - `registeredAt = block.timestamp` |
| | - Emit `ArtworkRegistered(artworkId, creator, contentHash)` |
| **Gas ước tính** | ~80.000 – 120.000 gas |

### Bước 4 – Xác minh (đã có – Hoàng Sen)

Contract `ArtworkVerifier.sol` đọc dữ liệu từ `ArtworkRegistry` thông qua interface `IArtworkRegistry`. Phần này đã hoàn thành.

## 3. Mẫu Metadata JSON

Xem file: [`docs/Metadata_Mau_PoC.json`](Metadata_Mau_PoC.json)

## 4. Sơ đồ quan hệ dữ liệu on-chain

```
┌─────────────────────────────────────────────┐
│              ArtworkRegistry                │
│─────────────────────────────────────────────│
│  mapping(uint256 => Artwork) artworks       │
│  mapping(bytes32 => uint256) hashToId       │
│  uint256 nextArtworkId                      │
│─────────────────────────────────────────────│
│  Artwork {                                  │
│    bytes32  contentHash    ← SHA-256 file   │
│    address  creator        ← msg.sender     │
│    uint64   registeredAt   ← timestamp      │
│    Status   status         ← Active/...     │
│    bool     minted         ← false ban đầu  │
│    string   metadataURI    ← "ipfs://..."   │
│  }                                          │
└──────────────────┬──────────────────────────┘
                   │ đọc qua IArtworkRegistry
                   ▼
┌─────────────────────────────────────────────┐
│           ArtworkVerifier (Hoàng Sen)       │
│  verifyArtwork(hash) → VerificationReport  │
│  verifyArtworkById(id, hash) → bool        │
│  getOwner / isOwner / getStatus / isActive  │
└─────────────────────────────────────────────┘
```

## 5. Event được phát ra

| Event | Tham số | Khi nào |
|---|---|---|
| `ArtworkRegistered` | `artworkId`, `creator`, `contentHash` | Đăng ký tác phẩm mới thành công |
| `ArtworkStatusChanged` | `artworkId`, `oldStatus`, `newStatus` | Admin thay đổi trạng thái (Active ↔ Disputed ↔ Revoked) |
| `ArtworkMinted` | `artworkId` | Đánh dấu tác phẩm đã được mint NFT |

---

> **Ghi chú:** Đây là phiên bản PoC đơn giản. Phiên bản chính thức sẽ bổ sung:
> - Commit–Reveal 2 bước (chống front-running) – theo đặc tả §9.2
> - Xác minh nghệ sĩ (KYC off-chain) 
> - Liên kết với ArtNFT (TV07) để mint NFT sau khi đăng ký
