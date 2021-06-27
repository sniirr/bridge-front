import { combineReducers } from 'redux'
import {connectModalReducer} from "components/ConnectModal"
import {accountsReducer} from "store/accounts"
import {bridgeReducer} from "components/Bridge";

export default combineReducers({
    accounts: accountsReducer,
    connectModal: connectModalReducer,
    bridge: bridgeReducer,
})