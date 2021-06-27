import _ from 'lodash'
import {makeReducer, reduceUpdateKey} from "utils/reduxUtils";
import {initAccessContext} from 'eos-transit'
import scatter from 'eos-transit-scatter-provider'
import tokenpocket from 'eos-transit-tokenpocket-provider'
import AnchorLinkProvider from 'eos-transit-anchorlink-provider'

export const EOS_CHAIN = {
    chainId: '5fff1dae8dc8e2fc4d5b23b2c7665c97f9e9d8edf2b6485a86ba311c25639191',
    host: 'api.kylin.alohaeos.com',
    port: 443,
    protocol: 'https'
}

const asd = 'asfljsdlfjsdlfjsldjflskdjf'

console.log(asd.substring(2, 15).length)

export const connectToEOS = async ({index}) => {
    try {
        const accessContext = initAccessContext({
            appName: 'DeFights',
            network: EOS_CHAIN,
            walletProviders: [
                scatter(),
                AnchorLinkProvider(),
                // AnchorLinkProvider(asd),
                // AnchorLinkProvider(Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)),
                tokenpocket(),
            ]
        });

        const walletProviders = accessContext.getWalletProviders()
        // const walletType = localStorage.getItem('walletType')
        const selectedProvider = walletProviders[index]
        const wallet = accessContext.initWallet(selectedProvider)

        await wallet.connect()
        await wallet.login()
        return [_.get(wallet, 'auth.accountName'), wallet]
    } catch (e) {
        console.error("EOS connection failed", e);
    }
    return null
}

export const connectToMetamask = async () => {
    try {
        const {ethereum} = window;
        const {chainId} = ethereum;

        if (chainId === "0x3") {
            if (!!ethereum) {
                const accounts = await ethereum.request({
                    method: "eth_requestAccounts",
                });
                return accounts[0]
            }
        } else {
            alert("Must connect to Ropsten testnet");
        }
    } catch (e) {
        console.error("MetaMask connection failed", e);
    }
    return null
}

export const connectWallet = (chainKey, opts = {}) => async dispatch => {
    let address = ''
    let accessContext = null

    switch (chainKey) {
        case 'ETH':
            address = await connectToMetamask(opts)
            break
        case 'EOS':
            [address, accessContext] = await connectToEOS(opts)
            break
    }

    if (!_.isEmpty(address)) {
        dispatch({
            type: 'WALLETS.LOGIN',
            payload: {chainKey, address, accessContext}
        })
    }
}

export const updateDFAccount = account => ({
    type: 'ACCOUNTS.UPDATE_DF_ACCOUNT',
    payload: account,
})

export const connectedWalletsSelector = state => _.get(state, 'wallets', {})

export const guildIdSelector = state => _.get(state, `wallets.DEFIGHTS.team`, -1)

const INITIAL_STATE = {
    DEFIGHTS: {
        name: '',
        gender: 'male',
        build: 'balanced',
        tone: 'medium',
    }
}

export const walletsReducer = makeReducer({
    'WALLETS.LOGIN': (state, action) => {
        const {chainKey, ...account} = action.payload
        return {
            ...state,
            [chainKey]: account,
        }
    },
    'ACCOUNTS.UPDATE_DF_ACCOUNT': reduceUpdateKey('DEFIGHTS'),
}, INITIAL_STATE)