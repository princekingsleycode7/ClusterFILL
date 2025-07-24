// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract ClusterFiShare is ERC721, Ownable {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIdCounter;

    // --- Enums for NFT State ---
    enum NftType { INVESTOR, UNDERWRITER }
    enum NftStatus { PENDING, CLAIMABLE, CLAIMED }

    // --- Custom Data Struct for each NFT ---
    struct ShareDetails {
        bytes32 clusterId;
        NftType nftType;
        NftStatus status;
        uint256 entitlement; // Final amount claimable in stablecoin cents (e.g., 200 for $2.00)
    }

    // Mapping from Token ID to our custom share details
    mapping(uint256 => ShareDetails) public shareDetails;

    // --- Constructor ---
    constructor() ERC721("ClusterFi Share", "CLF") {}

    // --- Core Minting Function (Owner Only) ---
    // This is the function our backend server will call.
    function safeMint(
        address to,
        bytes32 clusterId,
        NftType nftType,
        uint256 initialEntitlement
    ) public onlyOwner {
        uint256 tokenId = _tokenIdCounter.current();
        _tokenIdCounter.increment();
        _safeMint(to, tokenId);

        // Store the custom data associated with this new NFT
        shareDetails[tokenId] = ShareDetails({
            clusterId: clusterId,
            nftType: nftType,
            status: NftStatus.PENDING,
            entitlement: initialEntitlement
        });
    }

    // --- Placeholder for future functions ---
    // function settleShare(...) public onlyOwner { ... }
    // function claimEarnings(...) public { ... }
}