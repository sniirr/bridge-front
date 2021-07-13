import {makeReducer, reduceSetFull} from "shared/dapp-common/utils/reduxUtils";
import _ from 'lodash'

export const setTokens = tokens => ({
    type: 'DAPP.CORE.SET_TOKENS',
    payload: tokens
})

export const updateToken = (symbol, token) => ({
    type: 'DAPP.CORE.UPDATE_TOKEN',
    payload: {symbol, token}
})

export const tokensSelector = state => _.get(state, 'tokens')
export const tokenSelector = symbol => state => _.get(state, ['tokens', symbol], {})

export const tokensReducer = makeReducer({
    'DAPP.CORE.SET_TOKENS': reduceSetFull,
    'DAPP.CORE.UPDATE_TOKEN': (state, action) => {
        const {symbol, token} = action.payload
        return {
            ...state,
            [symbol]: {
                ..._.get(state, token, {}),
                ...token,
            },
        }
    }
}, {})