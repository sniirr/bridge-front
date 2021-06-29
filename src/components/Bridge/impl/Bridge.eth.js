import config from 'config/bridge.dev.json'
import bridgeAbi from "config/abi/bridgeAbi"
import web3 from 'utils/api/ethApi'
import tokenAbi from "config/abi/tokenAbi"
import TOKENS from "config/tokens.dev.json"

import { ethers } from "ethers"

// const provider = new ethers.providers.Web3Provider(window.ethereum, "any");

const {ethAddress: bridgeEthAddress} = config



const sendToken = async (account, amount, {ethTokenId}) => {

    const bridgeContract = new ethers.Contract(bridgeEthAddress, bridgeAbi, account.provider)

    const contract = await bridgeContract.connect(account.signer)

    const tx = await contract.sendToken(amount, ethTokenId)

    console.log('sendToken tx', tx)
    return tx
};


const approveAndSendToken = async (account, stakeAMount, {ethTokenId, symbol}) => {
    console.log("inside approve and send token");

    const usdcContract = new ethers.Contract(TOKENS.USDC.addresses.ETH, tokenAbi, account.provider)

    const contract = await usdcContract.connect(account.signer)

    // const contract = usdcContract;
    // const contract = token === "USDC" ? usdcContract : daiContract;
    // const approveAmount = stakeAMount
    const approveAmount = web3.utils.toWei("10000000000000000", "mwei")
    // if (checked) {
    //     approvedAmount =
    //         token === "USDC"
    //             ? web3.utils.toWei("10000000000000000", "mwei")
    //             : web3.utils.toWei("10000000000000000", "ether");
    // } else {
    //     approvedAmount = stakeAMount;
    // }
    console.log("approved amount ", approveAmount);

    const tx = await contract.approve(bridgeEthAddress, approveAmount)

    console.log('approveAndSendToken tx', tx)

    const tx2 = await sendToken(account, stakeAMount, {ethTokenId})

    // const result = await new Promise((resolve, reject) => {
    //     contract.methods.approve(bridgeEthAddress, approveAmount)
    //         .send({
    //             from: account.address,
    //         })
    //         .on("transactionHash", (hash) => {
    //             console.log("transactionHash approve ", hash);
    //         })
    //         .on("receipt", (receipt) => {
    //             console.log("receipt approve", receipt);
    //             // setapprovedMsg(receipt.transactionHash);
    //         })
    //         .on("confirmation", (confirmationNumber, receipt) => {
    //             console.log("confirmationNumber approve", confirmationNumber);
    //             console.log("receipt approve", receipt);
    //         })
    //         .on("error", (error) => {
    //             console.log("error approve", error);
    //             // setLoading(false);
    //             // seterrorMsg(error.message);
    //             reject(error)
    //         })
    //         .then(async () => {
    //             const res = await sendToken(account, stakeAMount, {ethTokenId})
    //             resolve(res)
    //         });
    // })

    console.log('approveAndSendToken tx2', tx2)
    return tx2
};

const transfer = async (account, amount, token) => {
    // const contract = symbol === "USDC" ? usdcContract : daiContract
    // const stakeAMount =
    //     symbol === "USDC"
    //         ? web3.utils.toWei(amount, "mwei")
    //         : web3.utils.toWei(amount, "ether");

    // const contract = usdcContract
    const usdcContract = new ethers.Contract(TOKENS.USDC.addresses.ETH, tokenAbi, account.provider)
    const contract = await usdcContract.connect(account.signer)

    const stakeAmount = web3.utils.toWei(amount, "mwei")

    console.log("stakeAMount ", stakeAmount);

    const approvedAmount = await contract.allowance(account.address, bridgeEthAddress)
    // const approvedAmount = await contract.methods.allowance(account.address, bridgeEthAddress).call();

    const appAmount = parseFloat(ethers.utils.formatUnits(approvedAmount, token.precision))

    console.log("approvedAmount in contract ", appAmount);

    return appAmount > stakeAmount ? sendToken(account, stakeAmount, token) : approveAndSendToken(account, stakeAmount, token)
    // return await appAmount > stakeAmount ? sendToken(account, stakeAmount, token) : approveAndSendToken(account, stakeAmount, token)
}


// const bridgeContract = eth.contract(bridgeAbi).at(ethAddress)
// const bridgeContract = new web3.eth.Contract(bridgeAbi, bridgeEthAddress)
// const usdcContract = new web3.eth.Contract(tokenAbi, TOKENS.USDC.addresses.ETH)
// const sendToken = async (account, amount, {ethTokenId}) => {
//     const result = await new Promise((resolve, reject) => {
//         console.log(`SEND_TOKEN from ${account.address} amount ${amount} tokenId ${ethTokenId}`)
//         bridgeContract.methods.sendToken(amount, ethTokenId)
//             .send({
//                 from: account.address,
//             })
//             .on("transactionHash", (hash) => {
//                 console.log("transactionHash  sendToken", hash);
//             })
//             .on("receipt", (receipt) => {
//                 console.log("receipt sendToken", receipt);
//                 // setLoading(false);
//                 // setsuccessMsg(receipt.transactionHash);
//                 resolve(receipt.transactionHash)
//             })
//             .on("confirmation", (confirmationNumber, receipt) => {
//                 console.log("confirmationNumber sendToken", confirmationNumber);
//                 console.log("receipt sendToken", receipt);
//             })
//             .on("error", (error) => {
//                 console.log("error sendToken", error);
//                 reject(error)
//                 // setLoading(false);
//                 // seterrorMsg(error.message);
//             });
//     })
//
//     console.log('sendToken result', result)
//     return result
//     // const resul = await bridgeContract.sendToken(amount, ethTokenId)
//     // bridgeContract.methods
//     //     .sendToken(amount, ethTokenId)
//     //     .send({
//     //         from: account.address,
//     //     })
//     //     .on("transactionHash", (hash) => {
//     //         console.log("transactionHash  sendToken", hash);
//     //     })
//     //     .on("receipt", (receipt) => {
//     //         console.log("receipt sendToken", receipt);
//     //         setLoading(false);
//     //         setsuccessMsg(receipt.transactionHash);
//     //     })
//     //     .on("confirmation", (confirmationNumber, receipt) => {
//     //         console.log("confirmationNumber sendToken", confirmationNumber);
//     //         console.log("receipt sendToken", receipt);
//     //     })
//     //     .on("error", (error) => {
//     //         console.log("error sendToken", error);
//     //         setLoading(false);
//     //         seterrorMsg(error.message);
//     //     });
// };
//
//
// const approveAndSendToken = async (account, stakeAMount, {ethTokenId, symbol}) => {
//     console.log("inside approve and send token");
//     const contract = usdcContract;
//     // const contract = token === "USDC" ? usdcContract : daiContract;
//     // const approveAmount = stakeAMount
//     const approveAmount = web3.utils.toWei("10000000000000000", "mwei")
//     // if (checked) {
//     //     approvedAmount =
//     //         token === "USDC"
//     //             ? web3.utils.toWei("10000000000000000", "mwei")
//     //             : web3.utils.toWei("10000000000000000", "ether");
//     // } else {
//     //     approvedAmount = stakeAMount;
//     // }
//     console.log("approved amount ", approveAmount);
//     const result = await new Promise((resolve, reject) => {
//         contract.methods.approve(bridgeEthAddress, approveAmount)
//             .send({
//                 from: account.address,
//             })
//             .on("transactionHash", (hash) => {
//                 console.log("transactionHash approve ", hash);
//             })
//             .on("receipt", (receipt) => {
//                 console.log("receipt approve", receipt);
//                 // setapprovedMsg(receipt.transactionHash);
//             })
//             .on("confirmation", (confirmationNumber, receipt) => {
//                 console.log("confirmationNumber approve", confirmationNumber);
//                 console.log("receipt approve", receipt);
//             })
//             .on("error", (error) => {
//                 console.log("error approve", error);
//                 // setLoading(false);
//                 // seterrorMsg(error.message);
//                 reject(error)
//             })
//             .then(async () => {
//                 const res = await sendToken(account, stakeAMount, {ethTokenId})
//                 resolve(res)
//             });
//     })
//
//     console.log('approveAndSendToken result', result)
//     return result
// };
//
// const transfer = async (account, amount, token) => {
//     // const contract = symbol === "USDC" ? usdcContract : daiContract
//     // const stakeAMount =
//     //     symbol === "USDC"
//     //         ? web3.utils.toWei(amount, "mwei")
//     //         : web3.utils.toWei(amount, "ether");
//
//     const contract = usdcContract
//     const stakeAmount = web3.utils.toWei(amount, "mwei")
//
//     console.log("stakeAMount ", stakeAmount);
//
//     const approvedAmount = await contract.methods.allowance(account.address, bridgeEthAddress).call();
//
//     console.log("approvedAmount in contract ", approvedAmount);
//
//     return await approvedAmount > stakeAmount ? sendToken(account, stakeAmount, token) : approveAndSendToken(account, stakeAmount, token)
//     // const response = await sendToken(account, stakeAmount, token);
//     //
//     // return response
//     // if (approvedAmount > stakeAMount) {
//     //     sendToken(stakeAMount, ethTokenId);
//     // } else {
//     //     approveAndSendToken(stakeAMount, ethTokenId, token);
//     // }
// }

export default {
    fetchTransferFee: () => '',

    transfer,
}