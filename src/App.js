import React from 'react'
import 'rc-slider/assets/index.css';
import 'css/main.scss'
import Bridge from "components/Bridge";
import {useDispatch} from "react-redux";
import ConnectModal, {showConnectModal} from "components/ConnectModal";
import CHAINS from 'config/chains.json'
import ethConnect from 'components/ConnectModal/impl/eth'
import eosConnect from 'components/ConnectModal/impl/eos'
import eosBridge from 'components/Bridge/impl/eos'

function App() {
    const dispatch = useDispatch()

    return (
        <div className="App">
            <header>
                <div className="button" onClick={() => dispatch(showConnectModal(['ETH', 'EOS']))}>Connect Wallets</div>
            </header>
            <div className="page bridge">
                <Bridge controllers={{
                    EOS: {...eosConnect, ...eosBridge},
                    ETH: ethConnect,
                }}/>
            </div>
            <ConnectModal config={CHAINS} handlers={{
                ETH: ethConnect,
                EOS: eosConnect,
            }}/>
        </div>
    );
}

export default App;
