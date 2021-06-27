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
}

export default useOnLogin
