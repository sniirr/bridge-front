import _ from 'lodash'
import React, {useEffect, useState} from 'react'
import {CheckCircleOutlineTwoTone, SwapHoriz} from '@material-ui/icons'
import './Bridge.scss'
import {useDispatch, useSelector} from "react-redux"
import Slider from 'rc-slider'
import {showModal} from "shared/components/Modal";
import {accountSelector, balanceSelector} from "modules/dapp-core/accounts"
import useOnLogin from "modules/dapp-core/hooks/useOnLogin";
import {amountToAsset, poll} from "utils/utils"
import Dropdown from 'components/Common/Dropdown'
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome'
import {faTimes, faAddressBook, faSync, faInfo} from '@fortawesome/free-solid-svg-icons'
import BridgeRegister from "./BridgeRegister"
import BridgeTxStatus from './BridgeTxStatus'
import {bridgeSelector} from "modules/dapp-bridge";
import classNames from "classnames";
import ActionButton from "components/Common/ActionButton";
import {ctrlSelector} from "modules/dapp-core/controllers";
import useOnRpcReady from "modules/dapp-core/hooks/useOnRpcReady";
import {tokenSelector} from "modules/dapp-core/tokens";
import AssetInput from "shared/components/AssetInput";
import {useForm} from "react-hook-form";

const Bridge = ({supportedChains, supportedTokens}) => {

    const dispatch = useDispatch()

    const controller = useSelector(ctrlSelector('bridge'))
    const coreController = useSelector(ctrlSelector('core'))

    // chain
    const [chains, setChains] = useState(supportedChains)
    const fromChainKey = chains[0]
    const toChainKey = chains[1]

    // accounts
    const fromAccount = useSelector(accountSelector(fromChainKey))
    const toAccount = useSelector(accountSelector(toChainKey))
    const fromConnected = !_.isEmpty(fromAccount?.address)
    const toConnected = !_.isEmpty(toAccount?.address)
    const isConnected = fromConnected && toConnected

    // bridge
    const {txFee, tokens, txStatus, config} = useSelector(bridgeSelector)

    const registerOn = _.get(config, 'bridgeRegistry.chainKey')
    const disabled = !isConnected || txStatus.active

    // tokens
    const [selectedSymbol, setSelectedSymbol] = useState(supportedTokens[0])
    const tokenConf = useSelector(tokenSelector(selectedSymbol))
    let token = {
        ...tokenConf,
        ..._.get(tokens[selectedSymbol], fromChainKey === registerOn ? 'outToken' : 'inToken', {
            symbol: selectedSymbol,
            precision: 0
        })
    }
    // token = {
    //     ...token,
    //     ..._.get(TOKENS, token.symbol, {})
    // }

    const currentTxFee = fromChainKey === token.issuedOn ? txFee.deposit : txFee.withdraw

    const {isRegistered} = useSelector(controller.isRegisteredSelector)
    const balance = useSelector(balanceSelector(fromChainKey, token.symbol))

    const [showModify, setShowModify] = useState(false)
    const [infiniteApproval, setInfiniteApproval] = useState(false)

    const [txFeesTimer, setTxFeesTimer] = useState(-1)

    // amount input
    const {register, handleSubmit, watch, formState: { errors }, setValue} = useForm({
        mode: 'onChange',
        reValidateMode: 'onChange',
        criteriaMode: 'all',
        defaultValues: {amount: '0'}
    })

    console.log('FORM ERRORS', errors)

    const amount = watch('amount')

    const onSubmit = () => {
        controller.transfer(fromChainKey, toChainKey, amount, token, infiniteApproval)
    }

    useOnRpcReady(registerOn, () => {
        controller.fetchSupportedTokens()
    })

    useOnLogin(fromChainKey, () => {
        coreController.fetchBalance(fromChainKey, token)
    })

    useOnLogin(registerOn, () => {
        controller.fetchRegistry()
    })

    useEffect(() => {
        if (!_.isEmpty(tokens)) {
            dispatch({
                type: 'BRIDGE.SET_TX_FEE',
                payload: {}
            })
            poll({
                interval: 10000,
                timerId: txFeesTimer,
                setTimerId: setTxFeesTimer,
                pollFunc: () => controller.fetchTransferFee(token),
            })
        }

        return () => {
            if (txFeesTimer !== -1) {
                clearTimeout(txFeesTimer)
                setTxFeesTimer(-1)
            }
        }
    }, [tokens, selectedSymbol])

    useEffect(() => {
        setValue('amount', 0, {shouldValidate: true})
        if (fromConnected) {
            coreController.fetchBalance(fromChainKey, token)
        }
    }, [fromChainKey, selectedSymbol])

    if (_.isNil(controller)) {
        return null
    }

    const setInputAmount = amount => {
        setValue('amount', amountToAsset(amount, token, false), {shouldValidate: true})
    }

    const onSliderChange = value => {
        setInputAmount(balance * value / 100)
        // setValue('amount', balance * value / 100, {shouldValidate: true})
    }

    const renderChainBox = (chainKey, direction) => {
        const address = direction === 'From' ? fromAccount?.address : toAccount?.address
        return (
            <div key={`bridge-chain-${chainKey}`} className="chain-box">
                <div className="item">
                    <div className="item-title">{direction}</div>
                    <div className="item-text">{chainKey}</div>
                </div>
                <div className="center-aligned-row chain-connect">
                    {!_.isEmpty(address) ? (
                        <>
                            <CheckCircleOutlineTwoTone/>
                            <span className="address" title={address}>{address}</span>
                        </>
                    ) : (
                        <div className="pointer red-text small-text"
                             onClick={() => dispatch(showModal('connect', {activeChains: [chainKey]}))}>CONNECT
                            WALLET</div>
                    )}
                </div>
            </div>
        )
    }

    return (
        <div className="dapp-bridge">
            <div className="row chains-row">
                {renderChainBox(fromChainKey, 'From')}
                <div className="arrow" onClick={() => setChains([toChainKey, fromChainKey])}>
                    <SwapHoriz/>
                </div>
                {renderChainBox(toChainKey, 'To')}
            </div>
            {!showModify && (isRegistered || !isConnected) ? (
                <>
                    <div className="row center-aligned-row">
                        <div className="item item-group">
                            <div className="item-title">Token</div>
                            <div className="item-text">
                                {_.size(supportedTokens) === 1 ? selectedSymbol : (
                                    <Dropdown id="token-select" withCaret={true}
                                              disabled={txStatus.active}
                                              items={_.map(supportedTokens, t => ({name: t}))}
                                              onItemClick={({name: symbol}) => {
                                                  setSelectedSymbol(symbol)
                                              }}>
                                        {selectedSymbol}
                                    </Dropdown>
                                )}
                            </div>
                        </div>
                        <div className="slider">
                            <Slider disabled={disabled} marks={{0: '0%', 25: '25%', 50: '50%', 75: '75%', 100: '100%'}}
                                    value={Math.round(amount / balance * 100)}
                                    onChange={onSliderChange}
                            />
                        </div>
                    </div>
                    <form onSubmit={handleSubmit(onSubmit)}>
                        <div className="row input-container">
                            <div className="item">
                                <AssetInput
                                    token={token}
                                    name="amount"
                                    label="Amount"
                                    disabled={disabled}
                                    error={amount > 0 ? _.get(errors, "amount") : null}
                                    maxAmount={balance || 0}
                                    register={register}
                                    setValue={setValue}
                                    onChange={setInputAmount}
                                    validations={{
                                        greaterThenFee: v => v > parseFloat(currentTxFee) || "Must be greater then the transaction fee"
                                    }}/>
                            </div>
                        </div>
                        {fromChainKey === 'ETH' && (
                            <div className="row input-container checkbox-row">
                                <div className="item">
                                    <div className="item-input">
                                        <input disabled={disabled} type="checkbox" className="input"
                                               checked={infiniteApproval}
                                               onChange={() => setInfiniteApproval(!infiniteApproval)}/> Infinite
                                        Approval
                                    </div>
                                </div>
                            </div>
                        )}
                        <div className="row center-aligned-spaced-row" style={{textAlign: 'right'}}>
                        <span className="info-message">
                            {!_.isEmpty(currentTxFee) && `Transaction Fee ${currentTxFee}`}
                        </span>
                            <ActionButton disabled={disabled} actionKey="transfer" onClick={handleSubmit(onSubmit)}>
                                Send Tokens
                            </ActionButton>
                        </div>
                    </form>
                    <BridgeTxStatus controller={controller}/>
                </>
            ) : (
                <BridgeRegister controller={controller} isModify={showModify}/>
            )}
            <div className="toolbar">
                {showModify && (
                    <FontAwesomeIcon icon={faTimes} onClick={() => setShowModify(false)}/>
                )}
                {!showModify && isConnected && isRegistered && (
                    <FontAwesomeIcon icon={faAddressBook} className={classNames({disabled})}
                                     title="Change registered Ethereum address"
                                     onClick={() => !disabled && setShowModify(true)}/>
                )}
                <FontAwesomeIcon icon={faSync} className={classNames({disabled})}
                                 title={`Refresh fees${disabled ? ' (requires login)' : ''}`}
                                 onClick={() => !disabled && controller.updatePrices()}/>
                <FontAwesomeIcon icon={faInfo} title="DAPP Bridge guide" onClick={() => console.log('guide')}/>
            </div>
        </div>
    )
}

export default Bridge