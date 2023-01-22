import Head from 'next/head'
import { useContext } from "react";
import { useRouter } from "next/router";
import styles from '../styles/Home.module.css'
import UAuth from "@uauth/js";
import Image from 'next/image'
import logo from "./default-button.png"
import { useEffect, useState } from "react";
import {universallogin} from "../components/uauth"
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
        .catch(() => {})
        .finally(() => setLoading(false))
    }, [])
  
    /*///////////////////////
    *   Login/out Functions
    *///////////////////////
     const handleLogin = async() => {
      setLoading(true)
      await uauth
        .loginWithPopup()
        .then(() => {
          <universallogin.Provider value = {"true"} />
          

        })
        .catch((e)=>{console.log(e)})
        .finally(() => {})
    
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