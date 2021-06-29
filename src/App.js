import React, {useEffect} from 'react'
import 'rc-slider/assets/index.css';
import 'css/main.scss'
import Bridge from "components/Bridge";
import {useDispatch} from "react-redux";
import ConnectModal, {showConnectModal} from "components/ConnectModal";
import CHAINS from 'config/chains.json'
import ethConnect from 'components/ConnectModal/impl/eth'
import eosConnect from 'components/ConnectModal/impl/eos'
import eosBridge from 'components/Bridge/impl/Bridge.eos'
import ethBridge from 'components/Bridge/impl/Bridge.eth'
import {makeBridgeController} from "components/Bridge/Bridge.module";
import {initRpc} from "store/accounts"

// init accounts
const connectControllers = {
    ETH: ethConnect,
    EOS: eosConnect,
}

// init bridge
const registerOn = 'EOS'
const bridgeController = makeBridgeController({
    EOS: eosBridge,
    ETH: ethBridge,
}, {registerOn: 'EOS'})

function App() {
    const dispatch = useDispatch()

    useEffect(() => {
        dispatch(initRpc('EOS', eosConnect))
    }, [])

    return (
        <div className="App">
            <header>
                <div className="button" onClick={() => dispatch(showConnectModal(['ETH', 'EOS']))}>Accounts</div>
            </header>
            <div className="page bridge">
                <Bridge controller={bridgeController}
                        connectControllers={connectControllers}
                        supportedChains={['EOS', 'ETH']}
                        registerOn={registerOn}
                        supportedTokens={['USDC', 'DAI']}/>
            </div>
            <ConnectModal config={CHAINS} handlers={connectControllers}/>
        </div>
    );
}

export default App;
