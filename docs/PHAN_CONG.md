# Phân công dự án ArtChain – 14 thành viên

> Điền tên và username GitHub vào cột **Họ tên / GitHub** ở bảng 1. Số mục (§) là mục trong `docs/ArtChain_DeTai_BlockchainNC.docx`.

## 1. Tổng quan phân nhóm

| Mã | Họ tên / GitHub | Nhóm | Vai trò | Thư mục làm việc |
|---|---|---|---|---|
| TV01 | | Điều phối | **Trưởng nhóm** – quản lý tiến độ, review & merge PR, tích hợp cuối | toàn repo |
| TV02 | | Điều phối | **Phụ trách tài liệu** – biên tập báo cáo Word, slide | `docs/`, `slides/` |
| TV03 | | Phân tích – Thiết kế | Phân tích nghiệp vụ & Use case | `docs/diagrams/` |
| TV04 | | Phân tích – Thiết kế | Kiến trúc hệ thống & sơ đồ luồng | `docs/diagrams/` |
| TV05 | | Phân tích – Thiết kế | Thiết kế dữ liệu (ERD, on/off-chain, metadata) | `docs/diagrams/`, `backend/db/` |
| TV06 | | Smart Contract | **Trưởng nhóm contract** – `ArtworkRegistry` | `contracts/` |
| TV07 | | Smart Contract | `ArtNFT` (ERC-721 + ERC-2981) | `contracts/` |
| TV08 | | Smart Contract | `ArtMarketplace` | `contracts/` |
| TV09 | | Kiểm thử – Bảo mật | Unit test Hardhat, coverage, đo gas | `contracts/test/` |
| TV10 | | Kiểm thử – Bảo mật | Bảo mật (Slither), deploy Sepolia, test tích hợp | `contracts/scripts/` |
| TV11 | | Backend | API + PostgreSQL + dịch vụ pHash | `backend/` |
| TV12 | | Backend | IPFS (Pinata) + Indexer (event → DB) | `backend/indexer/` |
| TV13 | | Giao diện | Figma prototype 14 màn hình (§16.1) | `design/` |
| TV14 | | Giao diện | **Trưởng nhóm frontend** – web Next.js + ethers.js | `frontend/` |

**Quy mô nhóm:** Điều phối 2 · Phân tích – Thiết kế 3 · Smart Contract 3 · Kiểm thử – Bảo mật 2 · Backend 2 · Giao diện 2.

## 2. Nhiệm vụ chi tiết

### Nhóm Điều phối

**TV01 – Trưởng nhóm**
- Lập kế hoạch tuần, họp nhóm, theo dõi tiến độ theo §16.2.
- Tạo GitHub Issues cho từng nhiệm vụ; review và merge Pull Request vào `main`.
- Chịu trách nhiệm tích hợp cuối (tuần 10) và chạy thử toàn bộ kịch bản demo §17.
- Viết §20 (Hạn chế & hướng phát triển), §21 (Kết luận).
- **Bàn giao:** kế hoạch tuần, biên bản họp, bản demo tích hợp.

**TV02 – Phụ trách tài liệu**
- Là **người duy nhất sửa file Word chính**; các thành viên gửi nội dung qua Pull Request (file `.md`) hoặc comment.
- Viết/biên tập §1 (Tổng quan), §2 (Phân tích bài toán), §19 (Q&A), Phụ lục thuật ngữ.
- Làm slide theo §18; tổng hợp câu hỏi phản biện từ các nhóm.
- **Bàn giao:** báo cáo Word hoàn chỉnh, slide.

### Nhóm Phân tích – Thiết kế

**TV03 – Nghiệp vụ & Use case** (§3, §4, §5, §6)
- Vẽ sơ đồ Use Case tổng quát + đặc tả UC03–UC08, UC11–UC12.
- Rà soát yêu cầu chức năng FR01–FR13 và phi chức năng.
- **Bàn giao:** sơ đồ Use Case (draw.io/StarUML, xuất PNG), bảng đặc tả use case.

**TV04 – Kiến trúc & luồng** (§7, §10)
- Vẽ sơ đồ kiến trúc Hybrid, sơ đồ triển khai.
- Vẽ 5 sequence diagram: đăng ký (commit–reveal), mint, đăng bán, mua, xác minh 2 lớp.
- **Bàn giao:** sơ đồ kiến trúc + 5 sequence diagram.

**TV05 – Dữ liệu** (§8)
- Vẽ ERD cho PostgreSQL; viết script tạo bảng `backend/db/schema.sql`.
- Sơ đồ trạng thái tác phẩm (Active → Disputed → Revoked); mẫu metadata JSON.
- **Bàn giao:** ERD, `schema.sql`, `docs/metadata-example.json`.

### Nhóm Smart Contract (Solidity 0.8.24 + OpenZeppelin 5.x + Hardhat)

**TV06 – Trưởng nhóm contract · `ArtworkRegistry`** (§9.2)
- Khởi tạo dự án Hardhat trong `contracts/` (tuần 5), cấu hình mạng Sepolia qua `.env`.
- Viết `ArtworkRegistry.sol`: `commitRegistration`, `registerArtwork`, `getArtworkByHash`, `setArtworkStatus`, `setMinted`, AccessControl.
- Thống nhất interface giữa 3 contract (`IArtworkRegistry`).
- **Bàn giao:** `ArtworkRegistry.sol`, interface, README hướng dẫn build.

**TV07 – `ArtNFT`** (§9.3)
- Viết `ArtNFT.sol`: `mintNFT(artworkId, royaltyBps)` kiểm tra creator/trạng thái/đã mint; `tokenURI` đọc từ Registry; ERC-2981.
- **Bàn giao:** `ArtNFT.sol`.

**TV08 – `ArtMarketplace`** (§9.4, §11)
- Viết `ArtMarketplace.sol`: `listItem`, `updatePrice`, `cancelListing`, `buyItem` (Checks-Effects-Interactions, nonReentrant), `withdraw`, phí nền tảng, Pause.
- **Bàn giao:** `ArtMarketplace.sol`, bảng tính chia tiền kiểm chứng §11.2.

### Nhóm Kiểm thử – Bảo mật

**TV09 – Unit test & gas** (§13, §15.1)
- Viết test Hardhat cho TC01–TC15, bao gồm contract giả lập tấn công reentrancy.
- Chạy `solidity-coverage` (mục tiêu ≥ 90%) và Hardhat Gas Reporter; cập nhật bảng gas §13 bằng số đo thật.
- **Bàn giao:** thư mục `contracts/test/`, báo cáo coverage, bảng gas thực tế.

**TV10 – Bảo mật, deploy & tích hợp** (§12, §15.2)
- Chạy Slither, xử lý/giải trình các cảnh báo; hoàn thiện ma trận rủi ro §12.
- Viết script deploy lên Sepolia, verify source trên Etherscan; ghi địa chỉ contract vào `contracts/deployments.json`.
- Chạy test tích hợp end-to-end §15.2 cùng TV14.
- **Bàn giao:** báo cáo Slither, script deploy, địa chỉ contract, biên bản kiểm thử.

### Nhóm Backend (Node.js + PostgreSQL)

**TV11 – API & pHash**
- API: tài khoản (email + Sign-In With Ethereum), hồ sơ nghệ sĩ, báo cáo/khiếu nại, xác minh nghệ sĩ.
- Dịch vụ pHash: `POST /verify/similar` (tìm ảnh khoảng cách Hamming ≤ 10).
- **Bàn giao:** `backend/` chạy được, tài liệu API (Swagger hoặc bảng trong README).

**TV12 – IPFS & Indexer**
- Tích hợp Pinata: upload file + metadata, trả CID.
- Indexer lắng nghe event (ArtworkRegistered, ArtworkMinted, Transfer, ItemListed, ItemSold, …) → ghi bảng `ChainEvent`, cập nhật owner/listing.
- **Bàn giao:** `backend/indexer/`, API lịch sử sở hữu cho màn hình timeline.

### Nhóm Giao diện

**TV13 – Figma prototype** (§16.1)
- Thiết kế 14 màn hình, ưu tiên: Tạo tác phẩm, Chi tiết NFT, Xác minh, Popup xác nhận giao dịch.
- Làm prototype click-through cho kịch bản demo §17 (dùng làm phương án dự phòng).
- Hỗ trợ TV02 thiết kế slide.
- **Bàn giao:** link Figma (ghi vào `design/README.md`), ảnh xuất PNG.

**TV14 – Trưởng nhóm frontend**
- Web Next.js + ethers.js: kết nối MetaMask, kiểm tra mạng Sepolia.
- Tính SHA-256 (Web Crypto) + pHash tại trình duyệt; luồng đăng ký 2 bước commit–reveal.
- Các trang tối thiểu cho demo: Tạo tác phẩm, Mint, Marketplace, Chi tiết NFT, Xác minh, Lịch sử.
- **Bàn giao:** `frontend/` chạy được, kết nối contract trên Sepolia.

## 3. Lịch làm việc (12 tuần)

| Tuần | Mốc | Người chịu trách nhiệm chính |
|---|---|---|
| 1–2 | Nghiên cứu chung; mỗi người đọc tài liệu đặc tả và phần mình phụ trách | Cả nhóm (TV01 điều phối) |
| 3–4 | Hoàn thành use case, yêu cầu, module | TV03 |
| 5–6 | Chốt kiến trúc, ERD, sequence diagram, **interface contract**; khởi tạo Hardhat | TV04, TV05, TV06 |
| 5–7 | Figma 14 màn hình | TV13 |
| 7–8 | Viết 3 contract + unit test | TV06, TV07, TV08, TV09 |
| 7–9 | Backend, IPFS, Indexer, Frontend | TV11, TV12, TV14 |
| 8 | **Mốc 1:** contract deploy Sepolia, coverage ≥ 90% | TV10, TV09 |
| 9 | **Mốc 2:** frontend gọi được contract thật | TV14 |
| 10 | **Mốc 3:** tích hợp end-to-end, Slither, sửa lỗi | TV01, TV10 |
| 11 | Hoàn thiện báo cáo Word, slide, quay video demo dự phòng | TV02, TV13 |
| 12 | Tập thuyết trình, tập Q&A | Cả nhóm |

## 4. Phụ thuộc giữa các phần việc

```
TV03 (use case) ──► TV04 (kiến trúc, sequence) ──► TV06 (interface contract)
TV05 (ERD) ─────────────────────────────────────► TV11, TV12 (backend)
TV06 (interface) ──► TV07, TV08 ──► TV09 (test) ──► TV10 (deploy Sepolia)
TV10 (địa chỉ contract) ──► TV12 (indexer), TV14 (frontend)
TV13 (Figma) ──► TV14 (frontend)
Tất cả ──► TV02 (báo cáo, slide) ──► TV01 (tích hợp cuối)
```

**Điểm nghẽn cần chú ý:** interface contract của TV06 (tuần 6) và địa chỉ deploy của TV10 (tuần 8). Hai mốc này trễ sẽ kéo theo backend và frontend.

## 5. Review chéo

Mỗi Pull Request cần ít nhất 1 người review theo cặp sau:

| Người viết | Người review |
|---|---|
| TV06 ↔ TV07 ↔ TV08 | Review chéo lẫn nhau; TV09 review thêm phần test |
| TV09 | TV10 |
| TV11 | TV12 |
| TV14 | TV13 (đối chiếu Figma) |
| TV03, TV04, TV05 | Review chéo lẫn nhau |
| TV02 | TV01 |

Tên nhánh: `tvXX/ten-phan-viec` (ví dụ `tv07/artnft-mint`).

## 6. Phân công thuyết trình (§18, 15 phút)

| Slide | Nội dung | Người trình bày |
|---|---|---|
| 1–3 | Đề tài, bối cảnh, mục tiêu & nguyên tắc | TV01 |
| 4–5 | Giải pháp tổng quan, Actor & chức năng | TV03 |
| 6–7 | Kiến trúc Hybrid, On-chain / Off-chain | TV04 |
| 8 | Hash 2 lớp: SHA-256 vs pHash | TV11 |
| 9 | Smart contract, commit–reveal | TV06 |
| 10 | Marketplace: chia tiền, royalty, bảo mật | TV08 |
| 11 | Demo trực tiếp | TV14 (thao tác) + TV10 (mở Etherscan) |
| 12 | Rủi ro, chi phí, kiểm thử | TV09 |
| 13 | Roadmap, kết luận | TV02 |

**Trả lời phản biện (§19):** câu hỏi về contract → TV06/TV07/TV08; bảo mật → TV10; dữ liệu, IPFS → TV05/TV12; pháp lý, NFT ≠ bản quyền → TV01/TV02; giao diện → TV13/TV14.
