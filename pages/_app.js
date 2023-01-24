import '../styles/globals.css'
import styles from '../styles/Home.module.css'
import Image from 'next/image'
import Link from 'next/link'
import Logo from '../public/xinfin.png'
import XDCAccount from '../components/context'
import {useState} from 'react'
import '../components/config';

function MyApp({ Component, pageProps }) {
  const [xdcAddress, setXDCAddress] = useState('')
  if(global.config.i18n.value=='true'){
 
  return (
    <>

    <header className={styles.header}>
      <div>
      <h2 className={styles.title}>NFTDeFi</h2>
      </div>
      <div className={styles.buttonContainer}>
        <Link href="/lend">
        <button className={styles.button}> Lend </button>
        </Link>
        <Link href="/borrow">
        <button className={styles.button}> Borrow </button>
        </Link>
        <Link href="/dashboard">
        <button className={styles.button}> Dashboard </button>
        </Link>
        <button className={styles.button}>{global.config.i18n.address}</button>
      </div>
    </header>

  <XDCAccount.Provider value={{xdcAddress, setXDCAddress}}>
    <Component {...pageProps} />
  </XDCAccount.Provider>

 
  </>
  )
    }
    else{
      return (
        <>
    
        <header className={styles.header}>
          <div>
          <h2 className={styles.title}>NFTDeFi</h2>
          </div>
         
        </header>
    
      <XDCAccount.Provider value={{xdcAddress, setXDCAddress}}>
        <Component {...pageProps} />
      </XDCAccount.Provider>
    
     
      </>
      )
    }
}

export default MyApp
