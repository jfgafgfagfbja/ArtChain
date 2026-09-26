// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/*
    ============================================================
                    ARTWORK BLOCKCHAIN PROJECT
    ============================================================

    FLOW:

    User
      ↓
    Artwork
      ↓
    Hash / Registry
      ↓
    NFT
      ↓
    Owner
      ↓
    Marketplace
      ↓
    Status
      ↓
    Verify
*/


contract ArtworkBlockchain {

    // =========================================================
    // 1. USER
    // =========================================================

    struct User {
        string name;
        bool registered;
    }

    mapping(address => User) public users;

    event UserRegistered(
        address indexed user,
        string name
    );

    function register(
        string memory userName
    ) public {

        require(
            !users[msg.sender].registered,
            "User already registered"
        );

        require(
            bytes(userName).length > 0,
            "Name cannot be empty"
        );

        users[msg.sender] = User({
            name: userName,
            registered: true
        });

        emit UserRegistered(
            msg.sender,
            userName
        );
    }


    // =========================================================
    // 2. ARTWORK
    // =========================================================

    struct Artwork {
        uint256 id;
        address creator;
        string title;
        string metadataURI;
        bool exists;
        bool registered;
    }

    uint256 private nextArtworkId = 1;

    mapping(uint256 => Artwork) public artworks;

    event ArtworkCreated(
        uint256 indexed artworkId,
        address indexed creator,
        string title
    );


    function createArtwork(
        string memory title,
        string memory metadataURI
    )
        public
        returns (uint256)
    {

        require(
            users[msg.sender].registered,
            "User must register first"
        );

        require(
            bytes(title).length > 0,
            "Title cannot be empty"
        );

        uint256 artworkId = nextArtworkId;

        nextArtworkId++;

        artworks[artworkId] = Artwork({
            id: artworkId,
            creator: msg.sender,
            title: title,
            metadataURI: metadataURI,
            exists: true,
            registered: false
        });

        emit ArtworkCreated(
            artworkId,
            msg.sender,
            title
        );

        return artworkId;
    }


    // =========================================================
    // 3. HASH / REGISTRY
    // =========================================================

    mapping(uint256 => bytes32) public artworkHashes;

    event ArtworkRegistered(
        uint256 indexed artworkId,
        bytes32 indexed artworkHash
    );


    /*
        Tạo hash từ thông tin Artwork.
    */
    function generateHash(
        uint256 artworkId
    )
        public
        view
        returns (bytes32)
    {

        require(
            artworks[artworkId].exists,
            "Artwork does not exist"
        );

        Artwork memory artwork = artworks[artworkId];

        return keccak256(
            abi.encodePacked(
                artwork.id,
                artwork.creator,
                artwork.title,
                artwork.metadataURI
            )
        );
    }


    /*
        Đăng ký Artwork vào Registry.
    */
    function registerArtwork(
        uint256 artworkId
    )
        public
        returns (bytes32)
    {

        require(
            artworks[artworkId].exists,
            "Artwork does not exist"
        );

        require(
            artworks[artworkId].creator == msg.sender,
            "Only creator can register artwork"
        );

        require(
            !artworks[artworkId].registered,
            "Artwork already registered"
        );

        bytes32 hashValue = generateHash(
            artworkId
        );

        artworkHashes[artworkId] = hashValue;

        artworks[artworkId].registered = true;

        emit ArtworkRegistered(
            artworkId,
            hashValue
        );

        return hashValue;
    }


    // =========================================================
    // 4. NFT
    // =========================================================

    string public constant name = "ArtworkNFT";
    string public constant symbol = "ART";

    uint256 private nextTokenId = 1;

    mapping(uint256 => address) private tokenOwners;

    mapping(uint256 => uint256) private tokenToArtwork;

    mapping(address => uint256) private balances;

    event NFTMinted(
        uint256 indexed tokenId,
        uint256 indexed artworkId,
        address indexed owner
    );


    /*
        mintNFT()

        Artwork → NFT → Owner
    */
    function mintNFT(
        uint256 artworkId
    )
        public
        returns (uint256)
    {

        require(
            artworks[artworkId].exists,
            "Artwork does not exist"
        );

        require(
            artworks[artworkId].registered,
            "Artwork must be registered first"
        );

        require(
            artworks[artworkId].creator == msg.sender,
            "Only creator can mint NFT"
        );

        uint256 tokenId = nextTokenId;

        nextTokenId++;

        tokenOwners[tokenId] = msg.sender;

        balances[msg.sender]++;

        tokenToArtwork[tokenId] = artworkId;

        emit NFTMinted(
            tokenId,
            artworkId,
            msg.sender
        );

        return tokenId;
    }


    /*
        ownerOf()

        Kiểm tra Owner của NFT.
    */
    function ownerOf(
        uint256 tokenId
    )
        public
        view
        returns (address)
    {

        address owner = tokenOwners[tokenId];

        require(
            owner != address(0),
            "NFT does not exist"
        );

        return owner;
    }


    /*
        getArtworkId()

        Xác định NFT thuộc Artwork nào.
    */
    function getArtworkId(
        uint256 tokenId
    )
        public
        view
        returns (uint256)
    {

        require(
            tokenOwners[tokenId] != address(0),
            "NFT does not exist"
        );

        return tokenToArtwork[tokenId];
    }


    // =========================================================
    // 5. TRANSFER OWNERSHIP
    // =========================================================

    event OwnershipTransferred(
        uint256 indexed tokenId,
        address indexed from,
        address indexed to
    );


    function transferOwnership(
        address to,
        uint256 tokenId
    )
        public
    {

        require(
            tokenOwners[tokenId] != address(0),
            "NFT does not exist"
        );

        require(
            tokenOwners[tokenId] == msg.sender,
            "Only owner can transfer"
        );

        require(
            to != address(0),
            "Invalid new owner"
        );

        address oldOwner = tokenOwners[tokenId];

        tokenOwners[tokenId] = to;

        balances[oldOwner]--;

        balances[to]++;

        /*
            Nếu NFT đang được bán,
            hủy listing khi owner chuyển trực tiếp.
        */
        if (listings[tokenId].active) {

            listings[tokenId].active = false;

            statusOf[tokenId] = Status.Owned;
        }

        emit OwnershipTransferred(
            tokenId,
            oldOwner,
            to
        );
    }


    function balanceOf(
        address owner
    )
        public
        view
        returns (uint256)
    {

        return balances[owner];
    }


    // =========================================================
    // 6. MARKETPLACE + STATUS
    // =========================================================

    enum Status {
        Registered,
        Minted,
        Owned,
        Listed,
        Sold,
        Verified
    }

    mapping(uint256 => Status) public statusOf;


    struct Listing {

        address seller;

        uint256 price;

        bool active;
    }


    mapping(
        uint256 => Listing
    ) public listings;


    event NFTListed(
        uint256 indexed tokenId,
        address indexed seller,
        uint256 price
    );


    event NFTSold(
        uint256 indexed tokenId,
        address indexed seller,
        address indexed buyer,
        uint256 price
    );


    /*
        Đưa NFT lên Marketplace.
    */
    function listForSale(
        uint256 tokenId,
        uint256 price
    )
        public
    {

        require(
            tokenOwners[tokenId] != address(0),
            "NFT does not exist"
        );

        require(
            tokenOwners[tokenId] == msg.sender,
            "Only owner can list"
        );

        require(
            price > 0,
            "Price must be greater than zero"
        );

        listings[tokenId] = Listing({
            seller: msg.sender,
            price: price,
            active: true
        });

        statusOf[tokenId] = Status.Listed;

        emit NFTListed(
            tokenId,
            msg.sender,
            price
        );
    }


    /*
        Hủy bán NFT.
    */
    function cancelListing(
        uint256 tokenId
    )
        public
    {

        require(
            listings[tokenId].active,
            "NFT is not listed"
        );

        require(
            listings[tokenId].seller == msg.sender,
            "Only seller can cancel"
        );

        listings[tokenId].active = false;

        statusOf[tokenId] = Status.Owned;
    }


    /*
        Mua NFT.
    */
    function buyNFT(
        uint256 tokenId
    )
        public
        payable
    {

        Listing memory listing = listings[tokenId];

        require(
            listing.active,
            "NFT is not for sale"
        );

        require(
            msg.value == listing.price,
            "Incorrect payment"
        );

        require(
            msg.sender != listing.seller,
            "Seller cannot buy own NFT"
        );

        require(
            tokenOwners[tokenId] == listing.seller,
            "Seller is no longer owner"
        );

        address seller = listing.seller;

        uint256 price = listing.price;

        /*
            Cập nhật trạng thái trước khi chuyển tiền ra ngoài.
        */
        tokenOwners[tokenId] = msg.sender;

        balances[seller]--;

        balances[msg.sender]++;

        listings[tokenId].active = false;

        statusOf[tokenId] = Status.Sold;

        (bool success, ) = payable(seller).call{value: price}("");
        require(success, "Payment transfer failed");

        emit NFTSold(
            tokenId,
            seller,
            msg.sender,
            price
        );
    }


    // =========================================================
    // 7. VERIFY
    // =========================================================

    /*
        Verify Artwork bằng hash.
    */
    function verifyArtwork(
        uint256 artworkId
    )
        public
        view
        returns (
            bool valid,
            bytes32 storedHash,
            bytes32 generatedHash
        )
    {

        require(
            artworks[artworkId].exists,
            "Artwork does not exist"
        );

        storedHash = artworkHashes[artworkId];

        generatedHash = generateHash(
            artworkId
        );

        valid =
            artworks[artworkId].registered &&
            storedHash == generatedHash;
    }


    /*
        Verify NFT.

        Kiểm tra:
        1. NFT tồn tại
        2. NFT liên kết Artwork
        3. Artwork có đăng ký hash
        4. Hash đúng
        5. Có Owner
    */
    function verifyNFT(
        uint256 tokenId
    )
        public
        view
        returns (
            bool valid,
            uint256 artworkId,
            address owner,
            bytes32 artworkHash,
            Status status
        )
    {

        require(
            tokenOwners[tokenId] != address(0),
            "NFT does not exist"
        );

        artworkId = tokenToArtwork[tokenId];

        owner = tokenOwners[tokenId];

        artworkHash = artworkHashes[artworkId];

        status = statusOf[tokenId];

        bytes32 currentHash =
            generateHash(artworkId);

        valid =
            artworks[artworkId].registered &&
            artworkHash == currentHash &&
            owner != address(0);
    }


    // =========================================================
    // 8. VIEW FUNCTIONS
    // =========================================================

    function getArtwork(
        uint256 artworkId
    )
        public
        view
        returns (
            uint256 id,
            address creator,
            string memory title,
            string memory metadataURI,
            bool exists,
            bool registered
        )
    {

        Artwork memory artwork =
            artworks[artworkId];

        return (
            artwork.id,
            artwork.creator,
            artwork.title,
            artwork.metadataURI,
            artwork.exists,
            artwork.registered
        );
    }


    function getListing(
        uint256 tokenId
    )
        public
        view
        returns (
            address seller,
            uint256 price,
            bool active
        )
    {

        Listing memory listing =
            listings[tokenId];

        return (
            listing.seller,
            listing.price,
            listing.active
        );
    }


    function getNextArtworkId()
        public
        view
        returns (uint256)
    {

        return nextArtworkId;
    }


    function getNextTokenId()
        public
        view
        returns (uint256)
    {

        return nextTokenId;
    }
}