import {useEffect} from 'react'
import {useSelector} from "react-redux";
import _ from 'lodash'

function useOnRpcReady(chainKey, onRpcReady) {

    const chain = useSelector(state => _.get(state, ['chains', chainKey]))

    const hasRpc = !_.isEmpty(chain?.rpc)

    useEffect(() => {
        if (hasRpc) {
            onRpcReady()
        }
    }, [hasRpc])
}

export default useOnRpcReady
