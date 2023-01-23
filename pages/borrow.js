import styles from '../styles/Home.module.css'
import {useState, useEffect, useContext} from 'react'
import XDCAccount from '../components/context';
import NFTLendABI from '../contracts/NFTLendABI.json'
import { ethers } from "ethers";
import Image from 'next/image'
import logo from "./login_image.png"
import Web3 from "web3"
import Link from 'next/link'
import '../components/config';
// import universallogin from '../components/uauth';

// ui to display NFTs users can borrow

export default function Borrow(){

    const contract = '0x11A316F21fe0D7AFCEC3eE3c4F08ceA7A70b842f';
    const provider = new ethers.providers.JsonRpcProvider('https://rpc.xinfin.network/');
    const NFTLend = new ethers.Contract(contract, NFTLendABI, provider);

    // for contract write
    const web3 = new Web3('https://rpc.xinfin.network/');
    const NFTLendWrite = new web3.eth.Contract(NFTLendABI,contract);
    // const context1 = useContext(universallogin)
    const context = useContext(XDCAccount)
    if(global.config.i18n.value==='true'){
    const[market, setMarket] = useState([])
    const[active, setActive] = useState([])
    const[searchTab, toggleSearch] = useState(false)

    useEffect(()=>{

        getMarket()

    },[])

    async function getMarket(){
        let nfts = await NFTLend.getMarketRecords()
        setMarket(nfts)
    }

    async function startBorrow(collection, id, collateral){

        let availableCheck = await NFTLend.isNFTAvailable(collection,id)

        if(context.xdcAddress === '') {
            alert('Account not Connected');
            return;
        }
        else if(availableCheck === false){
            alert('NFT Currently Unavailable');
            return
        } 
        else {

            const amount = web3.utils.toWei(String(collateral), 'ether');
            const value = web3.utils.toHex(amount);

            const tx = {
                from: context.xdcAddress,
                to: contract,
                gas: '0x493e0', 
                value: value, // this is the value in wei to send
                data: NFTLendWrite.methods.borrowNFT(collection, id).encodeABI()
            }
            const txHash = await ethereum.request({
                method: 'eth_sendTransaction',
                params: [tx]
            });

            console.log(txHash)
        }

    }


    return (
        <div style={mainContainer}>

            <div style={{display:'flex', gridTemplaceColumns:'auto auto'}}>   
                <input style={{width:'100%', height:'20px', alignSelf:'center'}} type='text' placeholder=' Search Collection'/>
                <button style={{height:'20px',width:'30px', alignSelf:'center', fontSize:'8px', backgroundColor:'#666666', marginRight:'2vw'}}> 🔎</button>
                <div style={{display:'flex', marginLeft:'auto'}}>
                <p> Marketplace</p> 
                </div>
            </div>

        {
            market.length === 0 ?
            <div style={cardContainer}>
                <div style={{display:'flex', justifyContent:'center', alignSelf:'center'}}>
                <p> Loading . . .</p>
                </div>
            </div>
            :
            market.map(arg=>{
                return(
                    <div style={cardContainer}>

                            <div style={{display:'grid', lineHeight:'5px', textAlign:'center', marginTop:'auto'}}>
                                
                                <div >
                                    <Image width={300} height={300} src={arg.tokenURI}></Image>
                                </div>

                                <div>
                                    <br></br>
                                    <p> Min. Deposit: </p> 
                                    <h2> {(parseInt(arg.collateral._hex )) + ' XDC'} </h2>
                                </div>

                                <button onClick={()=>startBorrow(arg.collection, parseInt(arg.tokenID._hex),parseInt(arg.collateral._hex ))} style={{height:'80px', marginTop:'2vh', width:'100%', fontSize:'15px'}}> Borrow </button>
                            </div>
                        
                    </div>
                )
            })
        }

        </div>
    )}
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
    display:'grid',
    height: '85vh',
    padding:'0rem 2rem',
    overflow:'auto',
}

const cardContainer = {
    display:'grid',
    border: '1px solid white',
    height:'500px',
    marginBottom:'50px',
  
   
}