// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract UserAndArtwork {
    struct User {
        string name;
        bool exists;
    }

    struct Artwork {
        uint256 id;
        address creator;//địa chỉ ví
        string title;//tên tác phẩm
        string description;// mô tả 
        string fileURI;//đường dẫn file
    }

    mapping(address => User) public users;
    mapping(uint256 => Artwork) public artworks;
    uint256 public artworkCount;

    event UserRegistered(address indexed user, string name);
    event ArtworkCreated(uint256 indexed artworkId, address indexed creator);

    function register(string calldata name) external {
        require(!users[msg.sender].exists, "User already registered");
        require(bytes(name).length > 0, "Name is required");

        users[msg.sender] = User(name, true);
        emit UserRegistered(msg.sender, name);
    }

    function createArtwork(
        string calldata title,
        string calldata description,
        string calldata fileURI
    ) external returns (uint256) {
        require(users[msg.sender].exists, "Register first");
        require(bytes(title).length > 0, "Title is required");
        require(bytes(fileURI).length > 0, "File URI is required");

        artworkCount++;
        artworks[artworkCount] = Artwork(
            artworkCount,
            msg.sender,
            title,
            description,
            fileURI
        );

        emit ArtworkCreated(artworkCount, msg.sender);
        return artworkCount;
    }
}