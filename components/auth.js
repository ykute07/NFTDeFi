import { useContext } from "react";
import XDCAccount from "./context";
 

// connect to metamask button

export default function ConnectButton() {

  const context = useContext(XDCAccount)

  async function connectUser(){
      if(window.ethereum === undefined || window.ethereum === null){
        alert('Unstoppable not Detected 🦊')
        return
      } else {
        try{
          let connect = await ethereum.request({ method: 'eth_requestAccounts' });
          context.setXDCAddress(connect[0])
        } catch(e){
            alert('Connection Error')
        }
      }
  }

  return (
    
      <button
      style={{padding:'25px 25px'}}
      onClick={connectUser}> 
      {context.xdcAddress === '' ? 'Connect XDC Account' : context.xdcAddress}
      </button>
      
    );
};

