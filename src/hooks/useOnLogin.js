import {useEffect} from 'react'
import {useSelector} from "react-redux";
import _ from 'lodash'

function useOnLogin(chainKey, onLogin) {

    const chain = useSelector(state => _.get(state, ['dappcore', chainKey]))

    const address = chain?.address

    useEffect(() => {
        if (!_.isEmpty(address)) {
            onLogin()
        }
    }, [address])

    return {
        isLoggedIn: !_.isEmpty(address),
        hasRpc: !_.isEmpty(chain?.rpc),
        rpc: chain?.rpc,
    }
}

export default useOnLogin
