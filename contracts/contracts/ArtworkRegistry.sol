// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IArtworkRegistry} from "./interfaces/IArtworkRegistry.sol";

/// @title ArtworkRegistry – Đăng ký & quản lý tác phẩm nghệ thuật số (PoC)
/// @notice Lưu trữ bản ghi tác phẩm on-chain. Nghệ sĩ đăng ký tác phẩm
///         bằng SHA-256 hash của file gốc, mỗi hash chỉ đăng ký được 1 lần.
/// @dev Implement IArtworkRegistry – là nguồn dữ liệu cho ArtworkVerifier.
///      Phiên bản PoC đơn giản, theo đặc tả §9.2.
/// @author An Em (ArtChain PoC)
contract ArtworkRegistry is IArtworkRegistry {

    uint256 private _nextId = 1;                       // artworkId bắt đầu từ 1
    mapping(uint256 => Artwork) private _artworks;     // id → Artwork
    mapping(bytes32 => uint256) private _hashToId;     // hash → id (tra cứu ngược)
    mapping(address => uint256[]) private _creatorWorks; // creator → danh sách id
    address public admin;

    // ------------------------------------------------------------------
    // Events
    // ------------------------------------------------------------------

    event ArtworkRegistered(uint256 indexed artworkId, address indexed creator, bytes32 contentHash);
    event ArtworkStatusChanged(uint256 indexed artworkId, Status oldStatus, Status newStatus);
    event ArtworkMinted(uint256 indexed artworkId);

    // ------------------------------------------------------------------
    // Errors
    // ------------------------------------------------------------------

    error EmptyHash();
    error EmptyURI();
    error HashExists(uint256 existingId);
    error NotFound(uint256 artworkId);
    error BadTransition(Status from, Status to);
    error AlreadyMinted(uint256 artworkId);
    error NotAdmin();

    // ------------------------------------------------------------------
    // Modifiers
    // ------------------------------------------------------------------

    modifier onlyAdmin()                          { if (msg.sender != admin) revert NotAdmin(); _; }
    modifier exists(uint256 id)                   { if (_artworks[id].creator == address(0)) revert NotFound(id); _; }

    constructor() { admin = msg.sender; }

    // ------------------------------------------------------------------
    // Đăng ký tác phẩm
    // ------------------------------------------------------------------

    /// @notice Đăng ký tác phẩm mới. Mỗi contentHash chỉ đăng ký 1 lần.
    function registerArtwork(bytes32 contentHash, string calldata metadataURI)
        external returns (uint256 artworkId)
    {
        if (contentHash == bytes32(0))        revert EmptyHash();
        if (bytes(metadataURI).length == 0)   revert EmptyURI();
        if (_hashToId[contentHash] != 0)      revert HashExists(_hashToId[contentHash]);

        artworkId = _nextId++;
        _artworks[artworkId] = Artwork(contentHash, msg.sender, uint64(block.timestamp), Status.Active, false, metadataURI);
        _hashToId[contentHash] = artworkId;
        _creatorWorks[msg.sender].push(artworkId);

        emit ArtworkRegistered(artworkId, msg.sender, contentHash);
    }

    // ------------------------------------------------------------------
    // Tra cứu (implement IArtworkRegistry)
    // ------------------------------------------------------------------

    /// @inheritdoc IArtworkRegistry
    function getArtworkByHash(bytes32 contentHash)
        external view override returns (uint256 artworkId, Artwork memory artwork)
    {
        artworkId = _hashToId[contentHash];
        if (artworkId != 0) artwork = _artworks[artworkId];
    }

    /// @inheritdoc IArtworkRegistry
    function getArtwork(uint256 artworkId)
        external view override returns (Artwork memory)
    {
        return _artworks[artworkId];
    }

    /// @notice Danh sách artworkId do một creator đăng ký.
    function getArtworksByCreator(address creator) external view returns (uint256[] memory) {
        return _creatorWorks[creator];
    }

    /// @notice Tổng số tác phẩm đã đăng ký.
    function totalArtworks() external view returns (uint256) { return _nextId - 1; }

    // ------------------------------------------------------------------
    // Quản lý trạng thái (Admin)
    // ------------------------------------------------------------------

    /// @notice Thay đổi trạng thái: Active↔Disputed, Active→Revoked, Disputed→Revoked.
    ///         Revoked là trạng thái cuối, không chuyển được.
    function setArtworkStatus(uint256 artworkId, Status newStatus)
        external onlyAdmin exists(artworkId)
    {
        Artwork storage a = _artworks[artworkId];
        Status old = a.status;
        if (newStatus == Status.None || old == newStatus || old == Status.Revoked)
            revert BadTransition(old, newStatus);
        a.status = newStatus;
        emit ArtworkStatusChanged(artworkId, old, newStatus);
    }

    /// @notice Đánh dấu tác phẩm đã mint NFT.
    function setMinted(uint256 artworkId) external onlyAdmin exists(artworkId) {
        if (_artworks[artworkId].minted) revert AlreadyMinted(artworkId);
        _artworks[artworkId].minted = true;
        emit ArtworkMinted(artworkId);
    }

    /// @notice Chuyển quyền admin.
    function transferAdmin(address newAdmin) external onlyAdmin {
        require(newAdmin != address(0), "Zero address");
        admin = newAdmin;
    }
}
