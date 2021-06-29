import {useEffect} from 'react'
import {useSelector} from "react-redux";
import _ from 'lodash'

function useOnLogin(chainKey, onLogin) {

    const account = useSelector(state => _.get(state, ['accounts', chainKey]))

    const address = account?.address

    useEffect(() => {
        if (!_.isEmpty(address)) {
            onLogin()
        }
    }, [address])

    return {
        isLoggedIn: !_.isEmpty(address),
        hasRpc: !_.isEmpty(account?.rpc),
        rpc: account?.rpc,
    }
}

export default useOnLogin
