import React from 'react';
import ReactDOM from 'react-dom';
import _ from 'lodash'
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import {Provider} from 'react-redux';
import makeStore from './store/makeStore'
import {initDappCore} from "modules/dapp-core";
import eosCore from "modules/dapp-core/impl/dapp-core.eos";
import ethCore from "modules/dapp-core/impl/dapp-core.eth";
import {initBridge} from "modules/dapp-bridge";
import eosBridge from "modules/dapp-bridge/impl/dapp-bridge.eos";
import ethBridge from "modules/dapp-bridge/impl/dapp-bridge.eth";
import tokens from 'config/tokens.json'
import chains from 'config/chains.json'

const store = makeStore()

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
    EOS: eosBridge,
    ETH: ethBridge,
}, {registerOn: 'EOS'}))

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
