import React, {useEffect} from 'react'
import 'rc-slider/assets/index.css';
import 'css/main.scss'
import Bridge from "components/Bridge";
import {useDispatch} from "react-redux";
import ConnectModal, {showConnectModal} from "components/ConnectModal";
import CHAINS from 'config/chains.json'
// import ethConnect from 'components/ConnectModal/impl/eth'
// import eosConnect from 'components/ConnectModal/impl/eos'
import {makeBridgeController} from "components/Bridge/Bridge.module";
import eosBridge from 'components/Bridge/impl/Bridge.eos'
import ethBridge from 'components/Bridge/impl/Bridge.eth'
import {initDappCore} from "modules/dapp-core"
import ethCore from 'modules/dapp-core/impl/dapp-core.eth'
import eosCore from 'modules/dapp-core/impl/dapp-core.eos'

// init accounts
// const connectControllers = {
//     ETH: ethConnect,
//     EOS: eosConnect,
// }

// init bridge
const registerOn = 'EOS'
const bridgeController = makeBridgeController({
    EOS: eosBridge,
    ETH: ethBridge,
}, {registerOn: 'EOS'})

const coreController = initDappCore({
    EOS: eosCore,
    ETH: ethCore,
})

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
        </div>
    );
}

export default App;
