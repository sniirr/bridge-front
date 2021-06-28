import _ from 'lodash'
import React, {useEffect, useState} from 'react'
import {Button} from '@material-ui/core'
import {useDispatch, useSelector} from "react-redux"
import {accountSelector} from "store/accounts"
import {regFeeSelector} from "components/Bridge"
import {amountToAsset} from "utils/utils"
import {isRegisteredSelector} from "components/Bridge/impl/Bridge.eos"
import {BRIDGE_REGISTRY_ERROR} from "./Bridge.common"

const BridgeRegister = ({controller, isModify}) => {

    const dispatch = useDispatch()

    const {address: connectedAddress} = useSelector(accountSelector('ETH'))
    const [addressInput, setAddressInput] = useState('')
    const [regFee, feeSymbol] = useSelector(regFeeSelector)
    const {error: registryError} = useSelector(isRegisteredSelector)

    useEffect(() => {
        dispatch(controller.fetchRegFee())
    }, [])

    useEffect(() => {
        setAddressInput(isModify ? '' : connectedAddress)
    }, [connectedAddress])

    const onRegisterClick = () => {
        dispatch(controller.register(addressInput, [regFee, feeSymbol], isModify || registryError === BRIDGE_REGISTRY_ERROR.ACCOUNT_MISMATCH))
    }

    let mainText = ''
    let secondaryText = ''
    if (registryError === BRIDGE_REGISTRY_ERROR.NOT_REGISTERED) {
        mainText = 'Your Ethereum and EOS accounts are not linked yet and needs to be registered.'
        secondaryText = 'This a one-time process, once linked you can bridge any supported tokens between these chains.'
    }
    else if (isModify) {
        mainText = 'Change the registered Ethereum address on EOS'
        secondaryText = ''
    }
    else {
        mainText = 'A different Ethereum account is registered'
        secondaryText = 'please switch account or modify registry'
    }

    return (
        <>
            <div className="row text-row">
                <p>{mainText}</p>
                {!_.isEmpty(secondaryText) && (<p className="small-text">{secondaryText}</p>)}
            </div>
            <div className="row input-container">
                <input className="input" type="text" value={addressInput} placeholder="Enter your ETH address"
                       onChange={e => setAddressInput(e.target.value)}/>
            </div>
            <div className="row center-aligned-spaced-row" style={{textAlign: 'right'}}>
                    <span className="info-message">
                        {regFee > 0 && `Registration Fee ${amountToAsset(regFee, {symbol: feeSymbol, precision: 4}, true, true)}`}
                    </span>
                <Button variant="contained" color="default" onClick={onRegisterClick}>Register</Button>
            </div>
        </>
    )
}

export default BridgeRegister