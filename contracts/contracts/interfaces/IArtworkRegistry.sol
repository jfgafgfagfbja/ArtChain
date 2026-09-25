// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title IArtworkRegistry
/// @notice Interface tối thiểu của ArtworkRegistry mà ArtworkVerifier cần đọc
///         (đặc tả §8.3, §9.2). Contract ArtworkRegistry thật phải khớp interface này.
interface IArtworkRegistry {
    /// None = chưa đăng ký (giá trị mặc định của mapping).
    enum Status { None, Active, Disputed, Revoked }

    struct Artwork {
        bytes32 contentHash;   // SHA-256 của file gốc
        address creator;       // ví đăng ký
        uint64  registeredAt;  // block.timestamp lúc đăng ký
        Status  status;
        bool    minted;
        string  metadataURI;   // "ipfs://<metadataCID>"
    }

    /// @return artworkId 0 nếu hash chưa được đăng ký
    function getArtworkByHash(bytes32 contentHash)
        external view returns (uint256 artworkId, Artwork memory artwork);

    /// @dev Trả về struct rỗng (creator = address(0)) nếu id không tồn tại.
    function getArtwork(uint256 artworkId) external view returns (Artwork memory);
}
