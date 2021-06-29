import React, {useEffect} from 'react'
import 'rc-slider/assets/index.css';
import 'css/main.scss'
import Bridge from "components/Bridge";
import {useDispatch} from "react-redux";
import ConnectModal, {showConnectModal} from "components/ConnectModal";
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
}, {registerOn: 'EOS'})

function App() {
    const dispatch = useDispatch()

    useEffect(() => {
        dispatch(coreController.initRpc('EOS'))
    }, [])

    return (
        <div className="App">
            <header>
                <div className="button" onClick={() => dispatch(showConnectModal(['ETH', 'EOS']))}>Accounts</div>
            </header>
            <div className="page bridge">
                <Bridge controller={bridgeController}
                        coreController={coreController}
                        supportedChains={['EOS', 'ETH']}
                        registerOn={registerOn}
                        supportedTokens={['USDC', 'DAI']}/>
            </div>
            <ConnectModal config={CHAINS} controller={coreController}/>
            <Notification/>
        </div>
    );
}

export default App;
