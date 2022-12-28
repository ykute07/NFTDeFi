import styles from '../styles/Home.module.css'
import NFTLendABI from '../contracts/NFTLendABI.json'
import {useState, useEffect, useContext} from "react"
import XDCAccount from '../components/context';
import { ethers } from "ethers";
import Web3 from "web3"

export default function Lend(){

    const contract = '0x11A316F21fe0D7AFCEC3eE3c4F08ceA7A70b842f';
    const provider = new ethers.providers.JsonRpcProvider('https://rpc.xinfin.network/');
    const NFTLend = new ethers.Contract(contract, NFTLendABI, provider);

     // for contract write
     const web3 = new Web3('https://rpc.xinfin.network/');
     const NFTLendWrite = new web3.eth.Contract(NFTLendABI,contract);

    const context = useContext(XDCAccount)

    const[address, setAddress] = useState('')
    const[id, setID] = useState('')
    const[worth, setWorth] = useState('')
    const[fee, setFee] = useState('')
    const[rate, setRate] = useState('')

    async function checkApproval(){
        try{
            let x = await NFTLend.isNFTApproved(address, id);
            console.log('approval check', x)
            return x;
        } catch(e) {
            console.log('approval check error', e)
        }
    }

    // submit transaction 
    async function lendNFT(){
        if(context.xdcAddress === '') {
            alert('Account not Connected');
            return;
        }
        else if(address === ''){
            alert('Enter Address')
            return;
        } 
        else if(id === '') {
            alert('Enter ID')
            return;
        } 
        else if(worth === '') {
            alert('Enter Worth')
            return;
        } 
        else if(fee === '') {
            alert('Enter Fee')
            return;
        } 
        else if(rate === '') {
            alert('Enter Rate')
        } 
        else {
            
           let x = await checkApproval();
           
           if(x === false){
               alert('Approve NFT with Contract First')
               return;
           } else {

               console.log(String(worth))
               console.log(String(fee))

                const tx = {
                    from: context.xdcAddress,
                    to: contract,
                    gas: '0x2e240', 
                    value: "0",
                    data: NFTLendWrite.methods.lendNFT(address, id, String(worth), String(fee), rate).encodeABI()
                }
                const txHash = await ethereum.request({
                    method: 'eth_sendTransaction',
                    params: [tx]
                });

                console.log(txHash)
            }
        }
    }

    return (
        <div style={container}>

            <div style={{textAlign:'right', lineHeight:'10px', marginTop:'5vh'}}>
                <h2> Lend your NFT</h2>
                <p> start earning fees 💰</p>
            </div>

            <div style={{display:'grid', lineHeight:'40px'}}>
               
                NFT Address:
                <input type='text' placeholder='0x...' onChange={(e)=>{setAddress(e.target.value)}}/> 
                NFT ID:
                <input type='text' placeholder='0' onChange={(e)=>{setID(e.target.value)}}/> 
                {/* Cost of NFT for borrowers to insure */}
                Est. Worth (XDC):
                <input type='number' placeholder='0' min='0' onChange={(e)=>{setWorth(e.target.value*1e18)}}/> 
                {/* Amount of tokens credit (convert to WEI) */}
                Fee (XDC):
                <input type='number' placeholder='0' min='0' onChange={(e)=>{setFee(e.target.value*1e18)}}/> 
                {/* How often fee is charged */}
                Rate (Seconds):
                <input type='number' placeholder='0' min='0' onChange={(e)=>{setRate(e.target.value)}}/> 
               
                <div style={{textAlign:'center',display:'grid', marginTop:'5vh' }}>
                    <button style={{ height:'8vh'}} onClick={()=>lendNFT()}>Lend</button> 
                </div>

            </div>

        </div>
    )
}


const container ={
    padding: '0 2rem',
    height: '90vh',
    width:'85vw',
    marginLeft:'auto',
    marginRight:'auto',
}