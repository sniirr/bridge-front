import React from 'react';
import ReactDOM from 'react-dom';
import _ from 'lodash'
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import {Provider} from 'react-redux';
import createStore from 'store/createStore'
import {initDappCore} from "shared/dapp-core";
import eosCore from "shared/dapp-core/impl/dapp-core.eos";
import ethCore from "shared/dapp-core/impl/dapp-core.eth";
import {initBridge} from "modules/dapp-bridge";
import {createController as createEosBridge} from "modules/dapp-bridge/impl/dapp-bridge.eos";
import {createController as createEthBridge} from "modules/dapp-bridge/impl/dapp-bridge.eth";

import tokens from 'config/tokens.json'
import chains from 'config/chains.json'
import bridge from 'config/bridge.json'
// import tokens from 'config/tokens.dev.json'
// import chains from 'config/chains.dev.json'
// import bridge from 'config/bridge.dev.json'

const store = createStore()

// ------------------------------------------
// init dapp-fronts
// ------------------------------------------
const {dispatch, getState} = store

dispatch(initDappCore({
    EOS: eosCore,
    ETH: ethCore,
}, {chains, tokens}))

const coreController = _.get(getState(), 'controllers.core')

coreController.initRpc('EOS')

dispatch(initBridge({
    EOS: createEosBridge(bridge),
    ETH: createEthBridge(bridge),
}, bridge, {chains, tokens}))

// ------------------------------------------
// end init dapp-fronts
// ------------------------------------------

ReactDOM.render(
    <Provider store={store}>
        <React.StrictMode>
            <App/>
        </React.StrictMode>
    </Provider>,
    document.getElementById('root')
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
