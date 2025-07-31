// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "hardhat/console.sol";

/**
 * @title ClusterFiShare
 * @dev This contract manages the lifecycle of investment shares as NFTs.
 * It handles minting, settling values, and allowing owners to claim their earnings.
 * The contract owner (the backend server) is responsible for all administrative actions.
 * Earnings are paid out in a specified ERC20 token (e.g., USDC).
 */
contract ClusterFiShare is ERC721, Ownable {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIdCounter;

    // The ERC20 token contract used for payouts (e.g., USDC on Sepolia).
    IERC20 public immutable usdcToken;

    // Enum to define the role of the NFT holder.
    enum NftType { INVESTOR, UNDERWRITER }

    // Enum to track the state of the NFT's financial lifecycle.
    enum NftStatus { PENDING, CLAIMABLE, CLAIMED }

    // Custom data structure to hold all details for a specific NFT share.
    struct ShareDetails {
        bytes32 clusterId;      // Link back to the off-chain cluster ID.
        NftType nftType;        // Whether this is an investor or underwriter share.
        NftStatus status;       // The current lifecycle state of the share.
        uint256 entitlement;    // The final amount claimable in stablecoin cents (e.g., 25500 for $255.00).
    }

    // Mapping from a Token ID to its detailed share information.
    mapping(uint256 => ShareDetails) public shareDetails;
    
    /**
     * @dev Sets up the contract, initializing the ERC721 token and storing the USDC token address.
     * @param _usdcAddress The contract address of the ERC20 stablecoin on the target network.
     */
    constructor(address _usdcAddress) ERC721("ClusterFi Share", "CLF") {
        require(_usdcAddress != address(0), "USDC address cannot be zero");
        usdcToken = IERC20(_usdcAddress);
    }

    /**
     * @dev Mints a new NFT share and assigns it. Can only be called by the contract owner (backend server).
     * @param to The wallet address of the recipient (investor or underwriter).
     * @param clusterId The off-chain cluster ID, converted to bytes32.
     * @param nftType The type of share being minted (INVESTOR or UNDERWRITER).
     * @param initialEntitlement The initial value of the share. For investors, this is 0. For underwriters, it is their principal + interest.
     * @return The ID of the newly minted token.
     */
    function safeMint(
        address to,
        bytes32 clusterId,
        NftType nftType,
        uint256 initialEntitlement
    ) public onlyOwner returns (uint256) {
        uint256 tokenId = _tokenIdCounter.current();
        _tokenIdCounter.increment();
        _safeMint(to, tokenId);

        shareDetails[tokenId] = ShareDetails({
            clusterId: clusterId,
            nftType: nftType,
            status: NftStatus.PENDING,
            entitlement: initialEntitlement
        });

        console.log("Minted Token ID %s for Cluster %s to %s", tokenId, string(abi.encodePacked(clusterId)), to);
        return tokenId;
    }

    /**
     * @dev Settles an investor's share, updating its final value. Can only be called by the owner.
     * @param tokenId The ID of the investor's NFT to settle.
     * @param finalEntitlement The calculated profit share for this investor.
     */
    function settleShare(
        uint256 tokenId,
        uint256 finalEntitlement
    ) public onlyOwner {
        require(shareDetails[tokenId].status == NftStatus.PENDING, "NFT not in PENDING state");
        require(shareDetails[tokenId].nftType == NftType.INVESTOR, "Only for Investor NFTs");

        console.log("Settling Investor Token ID %s with entitlement %s", tokenId, finalEntitlement);

        shareDetails[tokenId].entitlement = finalEntitlement;
        shareDetails[tokenId].status = NftStatus.CLAIMABLE;
    }
    
    /**
     * @dev Moves an underwriter's share to claimable status without changing its value. Can only be called by the owner.
     * @param tokenId The ID of the underwriter's NFT to make claimable.
     */
    function setShareToClaimable(uint256 tokenId) public onlyOwner {
        require(shareDetails[tokenId].status == NftStatus.PENDING, "NFT not in PENDING state");
        require(shareDetails[tokenId].nftType == NftType.UNDERWRITER, "Only for Underwriter NFTs");
        
        console.log("Setting Underwriter Token ID %s to CLAIMABLE", tokenId);
        
        shareDetails[tokenId].status = NftStatus.CLAIMABLE;
    }

    /**
     * @dev Allows the owner of a claimable NFT to withdraw their entitled funds. Publicly callable.
     * @param tokenId The ID of the NFT whose earnings are being claimed.
     */
    function claimEarnings(uint256 tokenId) public {
        // 1. Verify Ownership: Check if the caller owns the NFT.
        require(ownerOf(tokenId) == msg.sender, "Caller is not the owner of this NFT.");

        // 2. Verify Status: Check if the NFT is ready to be claimed.
        ShareDetails storage share = shareDetails[tokenId];
        require(share.status == NftStatus.CLAIMABLE, "NFT is not in a claimable state.");

        // 3. Update Status first to prevent re-entrancy attacks.
        share.status = NftStatus.CLAIMED;

        // 4. Transfer the entitlement amount of USDC to the owner.
        uint256 amountToTransfer = share.entitlement;
        require(amountToTransfer > 0, "No earnings to claim.");

        console.log("Claiming %s USDC for Token ID %s to address %s", amountToTransfer, tokenId, msg.sender);

        bool success = usdcToken.transfer(msg.sender, amountToTransfer);
        require(success, "USDC transfer failed.");
    }
}