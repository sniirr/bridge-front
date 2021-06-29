import { combineReducers } from 'redux'
import {connectModalReducer} from "components/ConnectModal"
import {dappReducer} from "modules/dapp-core"
import {bridgeReducer} from "components/Bridge";

export default combineReducers({
    dappcore: dappReducer,
    connectModal: connectModalReducer,
    bridge: bridgeReducer,
})