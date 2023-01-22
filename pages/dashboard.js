import {useContext, useState, useEffect} from 'react';
import { ethers } from "ethers";
import Web3 from "web3"
import ConnectButton from '../components/auth';
import XDCAccount from '../components/context';
import NFTLendABI from '../contracts/NFTLendABI.json'
import logo from "./login_image.png"
import Image from 'next/image'
import universallogin from '../components/uauth';
import Router  from "next/router";
import  { Redirect,Route } from 'react-router-dom'
import Link from 'next/link'
// ui for users to check their lendings / borrowings
import { useHistory } from "react-router-dom";
const contract = '0x11A316F21fe0D7AFCEC3eE3c4F08ceA7A70b842f'
const provider = new ethers.providers.JsonRpcProvider('https://rpc.xinfin.network/');
const NFTLend = new ethers.Contract(contract, NFTLendABI, provider);

 // for contract write
 const web3 = new Web3('https://rpc.xinfin.network/');
 const NFTLendWrite = new web3.eth.Contract(NFTLendABI,contract);

export default function Dashboard(){
    
    
    const context1 = useContext(universallogin)
    const context = useContext(XDCAccount)
    if(context1==='true'){
    const [tabView, setTabView] = useState('Borrowing')
    const [balance, setBalance] = useState('')
    const [lendings, setLendings] = useState('')
    const [borrowings, setBorrowings] = useState('')
    const [borrowURI, setBorrowURI] = useState('')
    
    useEffect(()=>{
        if(context.xdcAddress === ''){
            return;
        } else {
            checkBalance()
            getLendings()
            getBorrowings()
        }
    },[context.xdcAddress])

    useEffect(()=>{
        if(borrowings === '' || borrowings.length === 0){
            return;
        } else {
            // grab the uri of NFT borrowing
            checkURI()
        }
    },[borrowings])

    // web3 methods

    async function checkURI(){
        let x = await NFTLend.Market(borrowings.NFT, parseInt(borrowings.tokenID))
        setBorrowURI(x.tokenURI)
    }

    async function checkBalance(){
        let curBalance = await provider.getBalance(context.xdcAddress)
        let inXDC = parseInt(curBalance)/1e18
        setBalance(inXDC)
    }

    async function getLendings(){
        let x = await NFTLend.getLenderHistory(context.xdcAddress)
        console.log('lendings', x)
        setLendings(x)
    }

    async function getBorrowings(){
        let x = await NFTLend.Borrowers(context.xdcAddress)
        if(x.NFT === '0x0000000000000000000000000000000000000000'){
            return;
        } else {
            console.log('borrowings', x)
            setBorrowings(x)
        }
    }

    async function refillMeter(){
        try{
            let toDeposit = prompt('Enter Amount in XDC to Deposit');
            const amount = web3.utils.toWei(String(toDeposit), 'ether');
            const value = web3.utils.toHex(amount);
            const tx = {
                from: context.xdcAddress,
                to: contract,
                gas: '0x493e0', 
                value: value, 
                data: NFTLendWrite.methods.loadFeeMeter().encodeABI()
            }
            const txHash = await ethereum.request({
                method: 'eth_sendTransaction',
                params: [tx]
            });

            console.log(txHash)
        } catch(e){
            console.log('refill err', e)
        }
    }

    async function checkApproval(address, id){
        try{
            let x = await NFTLend.isNFTApproved(address, id);
            console.log('approval check', x)
            return x;
        } catch(e) {
            console.log('approval check error', e)
        }
    }

    async function returnNFT(){

        let isApproved = await checkApproval(borrowings.NFT, borrowings.tokenID)

        if(isApproved === false) {
            alert('Approve NFT with Contract First');
            return;
        } else {
       
            const tx = {
                from: context.xdcAddress,
                to: contract,
                gas: '0x493e0', 
                value: '0', 
                data: NFTLendWrite.methods.returnNFT(borrowings.NFT, borrowings.tokenID).encodeABI()
            }
            const txHash = await ethereum.request({
                method: 'eth_sendTransaction',
                params: [tx]
            });

            console.log(txHash)
        }
    }

    async function claimFee(nft, id){
       
        const tx = {
            from: context.xdcAddress,
            to: contract,
            gas: '0x493e0', 
            value: '0', 
            data: NFTLendWrite.methods.claimFee(nft, id).encodeABI()
        }
        const txHash = await ethereum.request({
            method: 'eth_sendTransaction',
            params: [tx]
        });

        console.log(txHash)
    }

    async function withdrawNFT(nft, id){
       
        const tx = {
            from: context.xdcAddress,
            to: contract,
            gas: '0x493e0', 
            value: '0', 
            data: NFTLendWrite.methods.withdrawNFT(nft, id).encodeABI()
        }
        const txHash = await ethereum.request({
            method: 'eth_sendTransaction',
            params: [tx]
        });

        console.log(txHash)
    }

    // display methods

    function displayLendings(){
        return(
            <div >
            {
                 lendings.length === 0 ?
                 <div style={{padding:'15% 5%', height:'50vh'}}>
                 <h2> No Lending Activity </h2>
                 </div>
                 :

                lendings.map(arg=>{
                    return(
                        <div style={lendingContainer}>
                            <div style={{padding:'0px 20px'}}>
                              <p> {'NFT: ' + arg.collection} </p>
                              <p> {'Token ID: ' + arg.tokenID}</p>
                              <p> {'XDC Fee: ' + arg.lenderFee}</p>
                              <p> {'Rate Interval: ' + arg.rateInterval + ' (s)'}</p>

                              
                            </div>

                            <div style={{textAlign:'center', padding:'15px 15px'}}>
                                 <button onClick={()=>claimFee(arg.collection, arg.tokenID)}style={{padding:'20px 20px', backgroundColor:'green'}}> Claim Fees</button>
                                 <button onClick={()=>withdrawNFT(arg.collection, arg.tokenID)} style={{padding:'20px 20px', marginLeft:'5px'}}> Withdraw</button>
                            </div>
                           
                        </div>
                    )
                })
            }
            </div>
        )
    }

    function displayBorrowings(){
        return(
            <div >
                {
                    borrowings.length === 0 ?
                    <div style={{padding:'15% 5%', height:'50vh'}}>
                    <h2> No Borrow Activity </h2>
                    </div>
                    :
                    <div>
                        <div style={{textAlign:'center', backgroundColor:'#333', padding:'15px 15px', borderRadius:'10px'}}>
                        <Image width={250} height={250} src={borrowURI}></Image>
                        <h2 style={{fontSize:'20px'}}> {formatAddress(borrowings.NFT)} </h2>
                        <h2 style={{fontSize:'1rem'}}> {'Token ID: ' + (parseInt(borrowings.tokenID))} </h2>
                        </div>
                        
                        <div style={{textAlign:'center', padding:'10px 10px', borderRadius:'10px'}}>
                            <p>{'Fee Meter: ' + (borrowings.feeMeter)}</p> 
                            <p>{'Redeemable: ' + (borrowings.collateral)}</p> 

                            <p> {'Borrow Date: ' + formatDate(parseInt(borrowings.date._hex))}</p>
                            <p> {'Last Credit: ' + formatDate(parseInt(borrowings.lastCredit))}</p>
                            <button style={{padding:'10px 10px', marginRight:'5px'}} onClick={()=>refillMeter()}> Refill Meter</button> 
                            <button style={{padding:'10px 10px'}} onClick={()=>returnNFT()}> Return NFT</button>
                        </div>
                    </div>

                }
            </div>
        )
    }

    function formatDate(timestamp) {
        let date = new Date(timestamp*1e3);
        return date.toDateString();
    }

    function formatAddress(arg) {
       let formatted = (arg.substring(0,6)+'...'+arg.substring(38, 42));
       return formatted;
    }


    return (
     <div style={mainContainer}>

 {
             context.xdcAddress === '' ? 
                <div style={{display:'flex', height:'100%', justifyContent:'center', alignItems:'center'}}>
                <ConnectButton/>
                </div>
               
             :
             <div>
                 <div style={{lineHeight:'15px', textAlign:'right', padding:'1rem 2rem'}}>
                     <p> Balance: </p>
                     <h1 style={{fontSize:'25px'}}> {String(balance).slice(0, -7) + ' XDC'} </h1>
                 </div>

                <div style={{height:'350px', padding:'0 1rem'}}>
                    <div style={{display:'flex', gap:'10px'}}>
                        <button style={{backgroundColor:'#555', borderBottom:'0px', height:'30px', width:'100px'}} onClick={()=>setTabView('Borrowing')}>Borrowing</button>  
                        <button style={{backgroundColor:'#555', borderBottom:'0px', height:'30px', width:'100px'}} onClick={()=>setTabView('Lending')}>Lending</button>
                    </div>
                    <div style={tabContainer}>

                    {
                        tabView === 'Borrowing' ? 
                        displayBorrowings()
                        :
                        displayLendings()
                    }

                    </div>
                </div>
             </div>
         }
       
     </div>
    )

}
       else {
        return(
            <div style={{textAlign:'center',marginTop:100 }}>
        <div style={{ padding:0,border:10,background:"#000000"}}>
      
         
        <Link href="/"><Image src={logo}  /></Link>
      
      </div>
      </div>
        )
        }
}

// styles

const mainContainer = {
    height: '85vh',
    padding:'1rem 1rem',
    overflow:'auto',
}

const tabContainer = {
    
   backgroundColor:'#555',
    padding:'10px 10px'
}

const lendingContainer = {
    display:'grid',
    //gridTemplateColumns:'auto auto',
    backgroundColor:'#999',
    marginBottom:'20px',
    borderRadius:'10px',
    alignItems:'center'
    
}