import _ from 'lodash'
import React, {useEffect} from 'react'
import {useSelector} from "react-redux"
import {accountSelector} from "shared/dapp-core"
import {regFeeSelector, BRIDGE_REGISTRY_ERROR, registrySelector} from "shared/dapp-bridge/dapp-bridge"
import {amountToAsset} from "shared/dapp-common/utils/utils"
import ActionButton from 'shared/dapp-common/components/ActionButton'
import {useForm} from "react-hook-form";
import web3 from 'shared/dapp-common/utils/ethApi'

const BridgeRegister = ({controller, isModify}) => {

    const {address: connectedAddress} = useSelector(accountSelector('ETH'))
    const registry = useSelector(registrySelector)
    const [regFee, feeSymbol] = useSelector(regFeeSelector)
    const {error: registryError} = useSelector(controller.isRegisteredSelector)

    const {register, handleSubmit, watch, formState: { errors }, setValue} = useForm({
        mode: 'onChange',
        reValidateMode: 'onChange',
        criteriaMode: 'all',
        defaultValues: {amount: '0'}
    })

    const address = watch('address')

    useEffect(() => {
        controller.fetchRegFee()
    }, [])

    useEffect(() => {
        setValue('address', isModify ? '' : connectedAddress, {shouldValidate: true})
    }, [connectedAddress])

    const onSubmit = () => {
        controller.register(address, [regFee, feeSymbol], isModify || registryError === BRIDGE_REGISTRY_ERROR.ACCOUNT_MISMATCH)
    }

    let mainText = ''
    let secondaryText = ''
    let buttonText = 'Modify'
    let feeText = 'Modification'
    if (registryError === BRIDGE_REGISTRY_ERROR.NOT_REGISTERED) {
        mainText = 'Your Ethereum and EOS accounts are not linked yet and needs to be registered.'
        secondaryText = 'This a one-time process, once linked you can bridge any supported tokens between these chains.'
        buttonText = 'Register'
        feeText = 'Registration'
    }
    else if (isModify) {
        mainText = 'Change the registered Ethereum address on EOS'
        secondaryText = ''
    }
    else {
        mainText = 'A different Ethereum account is registered to your EOS account'
        secondaryText = 'please switch account or modify registry'
    }

    const hasError = !_.isEmpty(address) && _.has(errors, 'address')

    return (
        <>
            <div className="row text-row">
                <p>{mainText}</p>
                {!_.isEmpty(secondaryText) && (<p className="small-text">{secondaryText}</p>)}
            </div>
            <div className="row input">
                <input type="text"
                       placeholder="Enter your ETH address"
                       {...register('address', {
                            validate: {
                                ethAddress: v => web3.utils.isAddress(v) || 'Invalid Ethereum address',
                                sameAddress: v => {
                                    return _.isEmpty(registry?.address) || v !== registry?.ethaddress || 'Must be a different address then current registered address'
                                }
                            }
                       })}
                />
                {hasError && (
                    <div className="error">{_.get(errors, 'address.message')}</div>
                )}
            </div>
            <div className="row center-aligned-spaced-row" style={{textAlign: 'right'}}>
                <span className="info-message">
                    {regFee > 0 && `${feeText} Fee ${amountToAsset(regFee, {symbol: feeSymbol, precision: 4}, true, true)}`}
                </span>
                <ActionButton actionKey="register" onClick={handleSubmit(onSubmit)}>{buttonText}</ActionButton>
            </div>
        </>
    )
}

export default BridgeRegister