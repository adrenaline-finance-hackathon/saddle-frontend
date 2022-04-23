// import React, { ReactElement, useEffect } from "react"
// import { ethers } from "ethers"

// export const MintingContext = React.createContext([])

// export default function MintingContextProvider({
//   children,
// }: React.PropsWithChildren<unknown>): ReactElement {
//   const [usdcamount, setUsdcamount] = React.useState("")
//   const provider = new ethers.providers.Web3Provider(window.ethereum, "any")

//   const usdc = {
//     address: "0x68ec573C119826db2eaEA1Efbfc2970cDaC869c4",
//     abi: [
//       "function name() view returns (string)",
//       "function symbol() view returns (string)",
//       "function gimmeSome() external",
//       "function balanceOf(address _owner) public view returns (uint256 balance)",
//       "function transfer(address _to, uint256 _value) public returns (bool success)",
//     ],
//   }

//   async function mintUsdc() {
//     await provider.send("eth_requestAccounts", [])

//     //Signing messages on the blockchain means creating digital signatures.
//     //These digital signatures are used to prove the ownership of an
//     //address without exposing its private key.
//     const signer = provider.getSigner()
//     // const userAddress = await signer.getAddress()
//     const usdcContract = new ethers.Contract(usdc.address, usdc.abi, signer)

//     const tx = await usdcContract.gimmeSome({ gasPrice: 20e9 })
//     console.log(`Transaction hash: ${tx.hash}`)

//     const receipt = await tx.wait()
//     // console.log(`Transaction confirmed in block ${receipt.blockNumber}`)
//     // console.log(`Gas used: ${receipt.gasUsed.toString()}`)
//   }

//   async function getUsdc() {
//     await provider.send("eth_requestAccounts", [])
//     const signer = provider.getSigner()
//     const usdcContract = new ethers.Contract(usdc.address, usdc.abi, signer)
//     const userAddress = await signer.getAddress()
//     usdcContract.balanceOf(userAddress).then((usdcBalance) => {
//       const newUsdcBalance = ethers.utils.formatUnits(usdcBalance, 6)
//       setUsdcamount(newUsdcBalance)
//     })
//   }

//   useEffect(() => {
//     // getAddress();
//     getUsdc();
//   }, [usdc])

//   return (
//     <MintingContext.Provider
//       value={{
//         usdcamount,
//         mintUsdc,
//         usdc,

//         // receiver,
//         // amount,
//         // addressResponse,
//         // amountResponse,
//         // isLoading,
//         // error,
//       }}
//     >
//       {children}
//     </MintingContext.Provider>
//   )
// }
