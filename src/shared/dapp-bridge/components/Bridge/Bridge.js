import _ from 'lodash'
import React, {useEffect, useState} from 'react'
import {CheckCircleOutlineTwoTone, SwapHoriz} from '@material-ui/icons'
import './Bridge.scss'
import {useDispatch, useSelector} from "react-redux"
import Slider from 'rc-slider'
import {showModal} from "shared/dapp-common/components/Modal";
import {accountSelector, balanceSelector, ctrlSelector, tokenSelector} from "shared/dapp-core"
import useOnLogin from "shared/dapp-common/hooks/useOnLogin";
import {amountToAsset, poll} from "shared/dapp-common/utils/utils"
import Dropdown from 'shared/dapp-common/components/Dropdown'
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome'
import {faTimes, faAddressBook, faSync, faInfo} from '@fortawesome/free-solid-svg-icons'
import BridgeRegister from "./BridgeRegister"
import BridgeTxStatus from './BridgeTxStatus'
import {bridgeSelector} from "shared/dapp-bridge";
import classNames from "classnames";
import ActionButton from "shared/dapp-common/components/ActionButton";
import useOnRpcReady from "shared/dapp-common/hooks/useOnRpcReady";
import AssetInput from "shared/dapp-common/components/AssetInput";
import {useForm} from "react-hook-form";

export const Bridge = ({supportedChains, supportedTokens}) => {

    const dispatch = useDispatch()

    let params = new URLSearchParams(window.location.search)
    const urlSym = _.toUpper(params?.get('symbol'))

    const controller = useSelector(ctrlSelector('bridge'))
    const coreController = useSelector(ctrlSelector('core'))

    // tokens
    const initialSym = !_.isEmpty(urlSym) && _.includes(supportedTokens, urlSym) ? urlSym : supportedTokens[0]
    const [selectedSymbol, setSelectedSymbol] = useState(initialSym)
    const tokenConf = useSelector(tokenSelector(selectedSymbol))

    const chainsDirectionByToken = token => {
        const from = _.get(token, 'issuedOn', supportedChains[0])
        const to = _.find(supportedChains, sym => sym !== from)
        return [from, to]
    }

    // chain
    const [chains, setChains] = useState(chainsDirectionByToken(tokenConf[selectedSymbol]))
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

    // token
    let token = {
        ...tokenConf,
        ..._.get(tokens[selectedSymbol], fromChainKey === registerOn ? 'outToken' : 'inToken', {
            symbol: selectedSymbol,
            precision: 0
        })
    }

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
        setChains(chainsDirectionByToken(token))
    }, [selectedSymbol])

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
                            {!_.isEmpty(currentTxFee) && `Transaction Fee ${currentTxFee}${fromChainKey === 'ETH' ? ' + Ethereum Gas fee' : ''}`}
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
                <a target="_blank" rel="noreferrer" href="https://medium.com/the-liquidapps-blog/dapp-token-cross-chain-bridging-guide-6c32bc627398">
                    <FontAwesomeIcon icon={faInfo} title="Bifrost guide" onClick={() => console.log('guide')}/>
                </a>
            </div>
        </div>
    )
}

export default Bridge