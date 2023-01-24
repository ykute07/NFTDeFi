import Head from 'next/head'
import { useRouter } from "next/router";
import styles from '../styles/Home.module.css'
import UAuth from "@uauth/js";
import Image from 'next/image'
import logo from "./default-button.png"
import { useEffect, useState } from "react";
import Dashboard from './dashboard';
import "../components/config"
export default function Home() {
  const router = useRouter();
  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState()
  
  
  const uauth = new UAuth(
    {
      clientID: "cb910a68-3550-48a9-8181-33d73897dbe3",
    redirectUri: "https://nftdefi.netlify.app/dashbboard",
    scope: "openid wallet email profile:optional social:optional"
    })

    useEffect(() => {
      setLoading(true)
      uauth
        .user()
        .then(setUser)
        .then(()=>{
          
        })
        .catch(() => {})
        .finally(() => setLoading(false))
    }, [])
  
    /*///////////////////////
    *   Login/out Functions
    *///////////////////////
     const handleLogin = async() => {
      
      
      await uauth
        .loginWithPopup()
        .then(() => {
         setLoading(true)
         global.config.i18n.value="true" 
         router.push("/dashboard")
         console.log(global.config.i18n.value)
         
        }).then(()=>{
          console.log(uauth.user().then(setUser))
          console.log(user.wallet_address)
          global.config.i18n.address = user.wallet_address
        })
        
        .catch((e)=>{console.log(e+"bye")})
        .finally((e) => {console.log(e+"hi")})
        
    }
  return (
    <>

      <Head>
        <title>NFTDeFi</title>
        <meta name="description" content="DeFi For NFTs" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div style={{textAlign:'center' , marginLeft:'auto', marginTop:'180px'}}>
       <h1> NFTs with DeFi Capabilities </h1>       
      </div>
        
      <div style={{textAlign:'center' }}>
       
       <button    style={{ padding:0 ,border:0,background:"#000000"}}
           onClick={         handleLogin
               
           }
         ><a>
        
          
        
        <Image src={logo}  />
         </a>
         </button>
         </div>

    </>
  )
}