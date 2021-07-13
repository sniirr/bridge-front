import React from 'react'
import 'rc-slider/assets/index.css';
import 'css/shared.scss'
import 'css/main.scss'
import {useDispatch} from "react-redux";
import Bridge from "components/Bridge";
import {Modals, showModal} from "shared/components/Modal";
import ConnectModal from "components/ConnectModal";
import Notification from "components/Notification"

const modals = {
    'connect': <ConnectModal/>,
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
                    activeChains: ['ETH', 'EOS']
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
                            supportedTokens={['DAPP', 'USDC', 'DAI']}
                    />
                </div>
            </div>
            <Modals modals={modals}/>
            <Notification/>
        </div>
    );
}

export default App;
