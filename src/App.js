import React, {useEffect} from 'react'
import 'rc-slider/assets/index.css';
import 'css/shared.scss'
import 'css/main.scss'
import Bridge from "components/Bridge";
import {useDispatch} from "react-redux";
import {Modals, showModal} from "shared/Modal";
import ConnectModal from "components/ConnectModal";
import Notification from "components/Notification"
import CHAINS from 'config/chains.json'
import {initDappCore} from "modules/dapp-core"
import ethCore from 'modules/dapp-core/impl/dapp-core.eth'
import eosCore from 'modules/dapp-core/impl/dapp-core.eos'
import {initBridge} from "modules/dapp-bridge";
import ethBridge from 'modules/dapp-bridge/impl/dapp-bridge.eth'
import eosBridge from 'modules/dapp-bridge/impl/dapp-bridge.eos'

// init core
const coreController = initDappCore({
    EOS: eosCore,
    ETH: ethCore,
})

// init bridge
const registerOn = 'EOS'
const bridgeController = initBridge({
    EOS: eosBridge,
    ETH: ethBridge,
}, {registerOn: 'EOS'}, coreController)

// init modals
const modals = {
    'connect': <ConnectModal config={CHAINS} controller={coreController}/>,
}

function App() {
    const dispatch = useDispatch()

    useEffect(() => {
        dispatch(coreController.initRpc('EOS'))
    }, [])

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
                    <Bridge controller={bridgeController}
                            coreController={coreController}
                            supportedChains={['EOS', 'ETH']}
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
