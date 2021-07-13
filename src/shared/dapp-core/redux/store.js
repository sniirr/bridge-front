import { createStore, applyMiddleware, combineReducers } from 'redux';
import thunk from 'redux-thunk';
import { composeWithDevTools } from 'redux-devtools-extension'
import {controllersReducer} from './controllers'
import {chainsReducer} from './chains'
import {accountsReducer} from './accounts'
import {tokensReducer} from './tokens'

export const createDappStore = ({reducers= {}, middleware = []}) => {
    const rootReducer = combineReducers({
        accounts: accountsReducer,
        controllers: controllersReducer,
        tokens: tokensReducer,
        chains: chainsReducer,
        ...reducers
    })
    const store = createStore(rootReducer, composeWithDevTools(applyMiddleware(thunk, ...middleware)))

    return store
}