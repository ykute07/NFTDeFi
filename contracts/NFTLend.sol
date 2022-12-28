// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/IERC721Metadata.sol";

contract NFTLend {

    struct NFT {
        uint256 lenderFee;
        // seconds interval
        uint256 rateInterval;
        // required xdc to borrow
        uint256 collateral;
        // token info
        uint256 tokenID;
        string tokenURI;
        address collection;
        // borrow status
        address lender;
        address borrower;
        bool available;
        // market status
        bool onMarket;
    }

    struct Account {
        uint256 date;
        uint256 collateral;
        uint256 feeMeter;
        uint256 lastCredit;
        uint256 tokenID;
        address NFT;
        bool liquidated;
    }

    // borrower => borrow status 
    mapping( address => Account ) public Borrowers;

    // lender => lend history
    mapping( address => NFT[] ) public Lenders;

    // collection => id => active status
    mapping(address=>mapping( uint256=>NFT )) public Market;

    // history of all NFTs lent 
    NFT[] public Records;

    // action: 'deposit' | 'withdraw' | 'borrow' | 'return'
    event Action(address initiator, address nft, uint256 id, string action);
    event Liquidated(address borrower, uint256 collateral, address nft, uint256 id);

    ///@notice Deposit an NFT to contract for others to borrow
    ///@dev must approve this contract for nft id to be lent
    ///@param _nft : address of NFT contract to deposit
    ///@param _id : address of NFT to deposit
    ///@param _worth : defined worth of NFT to recieve for liquidation (XDC Wei) 
    ///@param _fee : periodic fee to be collected from borrower (XDC Wei) 
    ///@param _rate : frequency of fee collection 
    function lendNFT(address _nft, uint256 _id, uint256 _worth, uint256 _fee, uint256 _rate) public {
        // will fail if not owner of nft
        IERC721(_nft).transferFrom(msg.sender, address(this), _id);
        // check for a token uri
        string memory _uri = getNFTURI(_nft, _id);
        NFT memory nft = NFT (_fee, _rate, _worth, _id, _uri, _nft, msg.sender, address(0), true, true);
        Market[_nft][_id] = nft;
        Lenders[msg.sender].push(nft);
        Records.push(nft);
        emit Action(msg.sender, _nft, _id, "lend");
    }

    /// @notice Withdraw an NFT that is not being borrowed 
    /// @dev only available to lender since a liquidated NFT cannot be returned to this contract
    ///@param _nft : address of NFT contract
    function withdrawNFT(address _nft, uint256 _id) public {
        NFT storage nft = Market[_nft][_id];
        require(msg.sender == nft.lender, "Invalid Access");
        require(nft.available == true, "NFT Unavailable");
        IERC721(_nft).transferFrom(address(this), msg.sender, nft.tokenID);
        // reset market state for NFT 
        NFT memory resetNFT = NFT (0, 0, 0, 0, "", address(0), address(0), address(0), false, false);
        Market[_nft][_id] = resetNFT;
        emit Action(msg.sender, _nft, _id, "withdraw");
    }

    /// @notice Collect fee from borrower 
    ///@param _nft : address of NFT to claim fee for
    function claimFee(address _nft, uint256 _id) public {

        NFT storage nft = Market[_nft][_id];
        Account storage borrower = Borrowers[nft.borrower];

        require(msg.sender == nft.lender, "Invalid Access");

        uint256 feeMeter = borrower.feeMeter;
        uint256 lastCredit = borrower.lastCredit;

        // intervals lapsed since last credited fee 
        uint256 intervals = (block.timestamp - lastCredit) / nft.rateInterval;
        // calculate lender fees from lapsed intervals
        uint256 toCollect = intervals * nft.lenderFee;
        // subtract lender fee from borrower meter
        uint256 updatedMeter = feeMeter - toCollect;

        // if fee meter is empty 
        if(updatedMeter <= 0){

            // retrieve borrower collateral 
            (bool success, ) = address(msg.sender).call{value: borrower.collateral}("");
            require(success, "Failed to Collect Funds");

            emit Liquidated(nft.borrower, borrower.collateral, _nft, _id);

            // reset borrower state
            borrower.lastCredit = block.timestamp;
            borrower.collateral = 0;
            borrower.tokenID = 0;
            borrower.NFT = address(0);
            borrower.liquidated = true;

            // reset NFT state
            NFT memory refresh = NFT (0, 0, 0, 0, "", address(0), address(0), address(0), false, false);
            Market[_nft][_id] = refresh;

        } else {
            // claim fee 
            (bool success, ) = address(msg.sender).call{value: toCollect}("");
            require(success, "Failed to Collect Fee");
            // update borrower meter
            borrower.feeMeter = updatedMeter;
            borrower.lastCredit = block.timestamp;
        }
    }

    /// @notice Deposit collateral to borrow an NFT for a fee 
    ///@param _nft : address of NFT to borrow
    function borrowNFT(address _nft, uint256 _id) public payable {

        NFT storage nft = Market[_nft][_id];
        Account storage borrowCheck = Borrowers[msg.sender];

        require(nft.available == true, "NFT Unavailable to Borrow");
        // ensure enough to cover NFT value
        require(msg.value >= nft.collateral, "Deposit More for NFT Collateral");
        // ensure not actively borrowing 
        require(borrowCheck.NFT == address(0), "Currently Borrowing an NFT");
       
        // split deposit
        uint256 meter = msg.value - nft.collateral;
        uint256 collateral = msg.value - meter;

        IERC721(_nft).transferFrom(address(this), msg.sender, nft.tokenID);

        Account memory borrower = Account(block.timestamp, collateral, meter, block.timestamp, _id, _nft, false);

        Borrowers[msg.sender] = borrower;
        nft.borrower = msg.sender;
        nft.available = false;

        emit Action(msg.sender, _nft, _id, "borrow");

    }

    /// @notice Return a borrowed NFT to reclaim deposit
    function returnNFT(address _nft, uint256 _id) public {

        NFT storage nft = Market[_nft][_id];
        Account storage borrower = Borrowers[msg.sender];

        require(nft.borrower == msg.sender, "Not Borrowing Specified NFT");
        require(borrower.liquidated == false, "Collateral Liquidated, NFT is Yours");

        IERC721(_nft).transferFrom(msg.sender, address(this), nft.tokenID);

        // return XDC collateral 
        uint256 toReceive = borrower.feeMeter + borrower.collateral;
        (bool success, ) = address(msg.sender).call{value: toReceive}("");
        require(success, "Failed to Send Funds");

        // make NFT available again
        nft.available = true;
        nft.borrower = address(0);
        // reset borrower state
        borrower.date = 0;
        borrower.feeMeter = 0;
        borrower.collateral = 0;
        borrower.tokenID = 0;
        borrower.NFT = address(0);
        borrower.liquidated = false;

        emit Action(msg.sender, _nft, _id, "return");
    }

    /// @notice allow a borrower to refill their meter to avoid getting liquidated
    function loadFeeMeter() public payable {
        Account storage borrower = Borrowers[msg.sender];
        require(msg.value > 0, "Empty Value Passed");
        require(borrower.collateral > 0, "Not Borrow Detected");
        borrower.feeMeter += msg.value;
    }

    /// @notice get nft market history
    function getMarketRecords() public view returns (NFT[] memory){
        return Records;
    }

    /// @notice get lender history
    function getLenderHistory(address lender) public view returns (NFT[] memory) {
        return Lenders[lender];
    }

    /// @notice check if a lender has approved their NFT with the contract
    /// @dev only used prior to lending or returning 
    function isNFTApproved(address nft, uint256 id) public view returns (bool) {
       if(IERC721(nft).getApproved(id) == address(this)){
           return true;
       } else {
           return false;
       }
    }

      /// @notice check if a given NFT is available to borrow
    function isNFTAvailable(address collection, uint256 id) public view returns (bool){
        if(
            Market[collection][id].onMarket == true
            && 
            Market[collection][id].available == true ){
            return true;
        } else {
            return false;
        }
    }

    /// @notice check for and return a URI for specified NFT
    function getNFTURI(address collection, uint256 id) public view returns (string memory) {
        return IERC721Metadata(collection).tokenURI(id);
    }

}


// -------------------------

/* Lend an NFT and collect XDC fees while doing so
    - you can continuously check borrower meter and collect fees
    - if a fee can't be collected liquidation happens for borrower and 
        you get the defined the worth of your NFT, while the borrower  
        indirectly purchases it

    * Borrow an NFT by depositing XCD collateral 
    - overcollateralize to cover lender fees 
    - if meter goes below threshold collateral gets liquidated by NFT owner
*/

/// Tests
// Account1: Lend NFT
// Account2: Borrow NFT
// Account1: Collect Fee
// Account1: Withdraw NFT => expect error
// Account2: Return NFT
// Account1: Withdraw NFT => expect success