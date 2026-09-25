// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";

/// @notice ERC-721 giả lập CHỈ DÙNG ĐỂ TEST ArtworkVerifier. ArtNFT thật do người phụ trách §9.3 viết.
contract MockArtNFT is ERC721 {
    constructor() ERC721("ArtChain Mock", "ACM") {}

    function mint(address to, uint256 tokenId) external {
        _mint(to, tokenId);
    }
}
