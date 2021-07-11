import React from 'react'
import 'rc-slider/assets/index.css';
import 'css/shared.scss'
import 'css/main.scss'
import Bridge from "components/Bridge";
import {useDispatch} from "react-redux";
import {Modals, showModal} from "shared/Modal";
import ConnectModal from "components/ConnectModal";
import Notification from "components/Notification"
import CHAINS from 'config/chains.json'

// init core
// const coreController = initDappCore({
//     EOS: eosCore,
//     ETH: ethCore,
// })

// init bridge
const registerOn = 'EOS'
// const bridgeController = initBridge({
//     EOS: eosBridge,
//     ETH: ethBridge,
// }, {registerOn: 'EOS'}, coreController)

// init modals
const modals = {
    'connect': <ConnectModal config={CHAINS}/>,
}

function App() {
    const dispatch = useDispatch()

    return (
        <div className="App">
            <header>
                <div className="center-aligned-row logo-container">
                    <div className="logo"/>
                    Bifrost
                </div>
                <div className="pointer" onClick={() => dispatch(showModal('connect', {
                    chains: ['ETH', 'EOS']
                }))}>Accounts
                </div>
            </header>
            <div className="page bridge">
                <div className="center">
                    <div className="info">
                        <h1>Bifrost Bridge</h1>
                        <p>
                            Bifrost token bridge is developed by the DAPP Account DAO (DAD) and powered by the DAPP
                            Network’s universal bridging technology.
                        </p>
                        <div className="list-item">
                            Login with both your EOS and Ethereum Wallets.
                        </div>
                        <div className="list-item">
                            Send tokens across bridges to Ethereum or EOS.
                        </div>
                    </div>
                    <Bridge supportedChains={['EOS', 'ETH']}
                            registerOn={registerOn}
                            supportedTokens={['DAPP', 'USDC', 'DAI']}/>
                </div>
            </div>
            <Modals modals={modals}/>
            <Notification/>
        </div>
    );
}

export default App;
