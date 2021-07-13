import _ from "lodash";
import {createLogger} from 'redux-logger';
import {createDappStore, initDappCore} from "shared/dapp-core";
import {bridgeReducer, initBridge} from "shared/dapp-bridge"
import {notificationReducer} from "shared/dapp-common/components/Notification"
import {actionStatusReducer} from 'shared/dapp-common/components/ActionButton'
import {modalReducer} from "shared/dapp-common/components/Modal"
import eosCore from "shared/dapp-core/impl/dapp-core.eos";
import ethCore from "shared/dapp-core/impl/dapp-core.eth";
import {createController as createEosBridge} from "shared/dapp-bridge/impl/dapp-bridge.eos";
import {createController as createEthBridge} from "shared/dapp-bridge/impl/dapp-bridge.eth";
import tokens from 'config/tokens.json'
import chains from 'config/chains.json'
import bridge from 'config/bridge.json'
// import tokens from 'config/tokens.dev.json'
// import chains from 'config/chains.dev.json'
// import bridge from 'config/bridge.dev.json'

const logger = createLogger({
    predicate: (store, {type}) => {
        return type !== 'BRIDGE.SET_TX_FEE'
    }
})

const createStore = () => {
    const store = createDappStore({
        reducers: {
            bridge: bridgeReducer,
            notification: notificationReducer,
            modal: modalReducer,
            actionStatus: actionStatusReducer,
        },
        middleware: [logger],
    })

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

    return store
}

export default createStore