// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC721} from "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import {IArtworkRegistry} from "./interfaces/IArtworkRegistry.sol";

/// @title ArtworkVerifier – Xác minh tác phẩm & kiểm tra quyền (PoC)
/// @notice Lớp 1 của quy trình xác minh 2 lớp (đặc tả §10.6): so khớp SHA-256
///         với bản ghi on-chain, trả về nguồn gốc, trạng thái và chủ sở hữu hiện tại.
///         Tất cả hàm đều là `view`: gọi miễn phí, không cần ví, không tạo giao dịch.
/// @dev Không lưu dữ liệu riêng; chỉ đọc từ ArtworkRegistry và ArtNFT.
///      Theo đặc tả §9.3, tokenId = artworkId.
contract ArtworkVerifier {
    IArtworkRegistry public immutable registry;
    IERC721 public immutable nft;

    /// Kết quả xác minh một file (đặc tả §6.7, UC08).
    struct VerificationReport {
        bool found;                       // hash có trong Registry không
        uint256 artworkId;                // 0 nếu không tìm thấy
        address creator;
        uint64 registeredAt;
        IArtworkRegistry.Status status;
        bool minted;
        address currentOwner;             // address(0) nếu chưa mint
        string metadataURI;
    }

    error ZeroAddress();

    constructor(IArtworkRegistry registry_, IERC721 nft_) {
        if (address(registry_) == address(0) || address(nft_) == address(0)) revert ZeroAddress();
        registry = registry_;
        nft = nft_;
    }

    // ------------------------------------------------------------------
    // Xác minh
    // ------------------------------------------------------------------

    /// @notice Xác minh một file bằng SHA-256 của nó.
    /// @param contentHash SHA-256 của file cần kiểm tra (tính ở client).
    /// @return report `found = false` nghĩa là KHÔNG TÌM THẤY trên chain;
    ///         client khi đó chuyển sang lớp 2 (pHash off-chain).
    function verifyArtwork(bytes32 contentHash) external view returns (VerificationReport memory report) {
        (uint256 artworkId, IArtworkRegistry.Artwork memory a) = registry.getArtworkByHash(contentHash);
        if (artworkId == 0) return report;

        report.found = true;
        report.artworkId = artworkId;
        report.creator = a.creator;
        report.registeredAt = a.registeredAt;
        report.status = a.status;
        report.minted = a.minted;
        report.metadataURI = a.metadataURI;
        report.currentOwner = a.minted ? getOwner(artworkId) : address(0);
    }

    /// @notice Kiểm tra file có đúng là tác phẩm `artworkId` không
    ///         (dùng khi người mua muốn đối chiếu file tải về với NFT đang xem).
    /// @return true nếu tác phẩm tồn tại và hash khớp tuyệt đối.
    function verifyArtworkById(uint256 artworkId, bytes32 contentHash) external view returns (bool) {
        IArtworkRegistry.Artwork memory a = registry.getArtwork(artworkId);
        return a.creator != address(0) && a.contentHash == contentHash;
    }

    // ------------------------------------------------------------------
    // Kiểm tra quyền
    // ------------------------------------------------------------------

    /// @notice Chủ sở hữu hiện tại của NFT.
    /// @return address(0) nếu token chưa được mint (không revert như `ownerOf`).
    function getOwner(uint256 tokenId) public view returns (address) {
        try nft.ownerOf(tokenId) returns (address owner) {
            return owner;
        } catch {
            return address(0);
        }
    }

    /// @notice Trạng thái hiện tại của tác phẩm: None / Active / Disputed / Revoked.
    function getStatus(uint256 artworkId) public view returns (IArtworkRegistry.Status) {
        return registry.getArtwork(artworkId).status;
    }

    /// @notice `account` có đang sở hữu NFT `tokenId` không.
    function isOwner(uint256 tokenId, address account) external view returns (bool) {
        return account != address(0) && getOwner(tokenId) == account;
    }

    /// @notice Tác phẩm có đang ở trạng thái cho phép mint/đăng bán/mua không (Active).
    function isActive(uint256 artworkId) external view returns (bool) {
        return getStatus(artworkId) == IArtworkRegistry.Status.Active;
    }
}
