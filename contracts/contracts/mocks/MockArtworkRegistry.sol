// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IArtworkRegistry} from "../interfaces/IArtworkRegistry.sol";

/// @notice Registry giả lập CHỈ DÙNG ĐỂ TEST ArtworkVerifier.
///         Không có commit–reveal, không phân quyền. ArtworkRegistry thật do người phụ trách §9.2 viết.
contract MockArtworkRegistry is IArtworkRegistry {
    uint256 private _counter;
    mapping(uint256 => Artwork) private _artworks;
    mapping(bytes32 => uint256) private _idByHash;

    function register(bytes32 contentHash, string calldata uri) external returns (uint256 id) {
        require(_idByHash[contentHash] == 0, "hash exists");
        id = ++_counter;
        _artworks[id] = Artwork(contentHash, msg.sender, uint64(block.timestamp), Status.Active, false, uri);
        _idByHash[contentHash] = id;
    }

    function setStatus(uint256 id, Status s) external {
        _artworks[id].status = s;
    }

    function setMinted(uint256 id) external {
        _artworks[id].minted = true;
    }

    function getArtworkByHash(bytes32 contentHash) external view returns (uint256 artworkId, Artwork memory artwork) {
        artworkId = _idByHash[contentHash];
        artwork = _artworks[artworkId];
    }

    function getArtwork(uint256 artworkId) external view returns (Artwork memory) {
        return _artworks[artworkId];
    }
}
