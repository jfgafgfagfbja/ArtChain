# ArtChain

**Nền tảng xác minh nguồn gốc, quyền sở hữu số và giao dịch tác phẩm nghệ thuật số ứng dụng Blockchain**

Lĩnh vực: Nghệ thuật & Sở hữu trí tuệ · Công nghệ: Ethereum (Sepolia) · Solidity · ERC-721 + ERC-2981 · IPFS

Tài liệu đặc tả đầy đủ: [`docs/ArtChain_DeTai_BlockchainNC.docx`](docs/ArtChain_DeTai_BlockchainNC.docx)

## Cấu trúc thư mục

| Thư mục | Nội dung | Mục tương ứng trong đặc tả |
|---|---|---|
| `docs/` | Tài liệu đặc tả, báo cáo, sơ đồ (use case, sequence, ERD) | Mục 1–15 |
| `contracts/` | Smart contract Solidity (ArtworkRegistry, ArtNFT, ArtMarketplace) + test Hardhat | Mục 9, 15 |
| `frontend/` | Web app Next.js + ethers.js (kết nối ví, đăng ký, mint, mua, xác minh) | Mục 7, 16.1 |
| `backend/` | API Node.js + PostgreSQL (hồ sơ, pHash, báo cáo), indexer | Mục 7, 8 |
| `design/` | Link Figma, ảnh chụp màn hình prototype | Mục 16.1 |
| `slides/` | Slide thuyết trình, video demo | Mục 17, 18 |

## Phân công (14 thành viên)

Chi tiết nhiệm vụ, lịch 12 tuần, phụ thuộc, cặp review và phân công thuyết trình: **[docs/PHAN_CONG.md](docs/PHAN_CONG.md)**

| Nhóm | Thành viên | Thư mục |
|---|---|---|
| Điều phối | TV01 (trưởng nhóm), TV02 (tài liệu) | toàn repo, `docs/`, `slides/` |
| Phân tích – Thiết kế | TV03, TV04, TV05 | `docs/diagrams/` |
| Smart Contract | TV06 (trưởng nhóm), TV07, TV08 | `contracts/` |
| Kiểm thử – Bảo mật | TV09, TV10 | `contracts/test/`, `contracts/scripts/` |
| Backend | TV11, TV12 | `backend/` |
| Giao diện | TV13 (Figma), TV14 (frontend) | `design/`, `frontend/` |

## Quy trình làm việc nhóm

1. **Clone lần đầu**
   ```bash
   git clone <URL-repo>
   cd ArtChain
   ```
2. **Luôn cập nhật trước khi làm**
   ```bash
   git checkout main
   git pull
   ```
3. **Tạo nhánh riêng cho mỗi phần việc** — không commit thẳng lên `main`
   ```bash
   git checkout -b tvXX/ten-phan-viec   # ví dụ: tv06/contract-registry
   ```
4. **Commit và push**
   ```bash
   git add .
   git commit -m "contracts: thêm ArtworkRegistry với commit-reveal"
   git push -u origin tvXX/ten-phan-viec
   ```
5. **Mở Pull Request** trên GitHub vào `main`, nhờ ít nhất 1 người review rồi mới merge.

### Quy ước commit

`<phần>: <mô tả ngắn>` — phần là một trong: `docs`, `contracts`, `frontend`, `backend`, `design`, `slides`.

### Lưu ý với file Word

File `.docx` không gộp (merge) được như code. Để tránh ghi đè lẫn nhau:
- Báo trong nhóm trước khi sửa `docs/ArtChain_DeTai_BlockchainNC.docx`; mỗi lúc chỉ một người sửa.
- Nếu cần góp ý, dùng tính năng Comment/Track Changes trong Word thay vì sửa trực tiếp.
- Luôn `git pull` trước khi mở file để sửa.

### Không được commit

Private key, seed phrase ví, file `.env`, API key (Pinata, Alchemy/Infura). Các file này đã được chặn trong `.gitignore`.
