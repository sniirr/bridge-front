import _ from 'lodash'
import React, {useEffect, useState} from 'react'
import {CheckCircleOutlineTwoTone, SwapHoriz} from '@material-ui/icons'
import {Button} from '@material-ui/core'
import './Bridge.scss'
import {useDispatch, useSelector} from "react-redux"
import Slider from 'rc-slider'
import {showConnectModal} from "components/ConnectModal"
import {accountsSelector, balanceSelector, fetchBalance} from "store/accounts"
import useOnLogin from "hooks/useOnLogin";
import {fetchRegistry} from "components/Bridge"
import TOKENS from 'config/tokens.json'
import {amountToAsset} from "utils/utils"
import Dropdown from 'components/Common/Dropdown'
import {isRegisteredSelector} from "components/Bridge/impl/eos"
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome'
import {faTimes, faAddressBook, faSync} from '@fortawesome/free-solid-svg-icons'
import BridgeRegister from "./BridgeRegister"

const Bridge = ({controllers = {}, supportedChains = ['EOS', 'ETH'], supportedTokens = ['USDC', 'DAPP'], registerOn = 'EOS'}) => {

    const dispatch = useDispatch()

    // accounts
    const connectedAccounts = useSelector(accountsSelector)
    const [amount, setAmount] = useState('0')

    // chain
    const [chains, setChains] = useState(supportedChains)
    const fromChain = chains[0]
    const toChain = chains[1]

    // token
    const [selectedSymbol, setSelectedSymbol] = useState(supportedTokens[0])
    const token = TOKENS[selectedSymbol]
    const balance = useSelector(balanceSelector(fromChain, selectedSymbol))

    // registry
    const {isRegistered, error: registryError} = useSelector(isRegisteredSelector)

    const [showModify, setShowModify] = useState(false)

    useOnLogin(fromChain, () => {
        dispatch(fetchBalance(fromChain, controllers[fromChain], selectedSymbol))
        if (registerOn === fromChain) {
            dispatch(fetchRegistry(fromChain, controllers[fromChain]))
        }
    })

    useEffect(() => {
        setAmount('0')
    }, [fromChain])

    const onSliderChange = value => {
        setAmount((balance * value / 100).toFixed(6))
    }

    const onTokenChange = ({name: symbol}) => {
        setSelectedSymbol(symbol)
        dispatch(fetchBalance(fromChain, controllers[fromChain], symbol))
    }

    const renderChainBox = (chainKey, direction) => {
        const isConnected = _.has(connectedAccounts, chainKey)

        const address = _.get(connectedAccounts, [chainKey, 'address'], 'Connected')
        return (
            <div key={`bridge-chain-${chainKey}`} className="chain-box">
                <div className="item">
                    <div className="item-title">{direction}</div>
                    <div className="item-text">{chainKey}</div>
                </div>
                <div className="center-aligned-row chain-connect">
                    {isConnected ? (
                        <>
                            <CheckCircleOutlineTwoTone/>
                            <span className="address" title={address}>{address}</span>
                        </>
                    ) : (
                        <Button color="secondary" onClick={() => dispatch(showConnectModal([chainKey]))}>Connect
                            Wallet</Button>
                    )}
                </div>
            </div>
        )
    }

    const fromConnected = _.has(connectedAccounts, fromChain)
    const isConnected = fromConnected && _.has(connectedAccounts, toChain)
    const disabled = !isConnected

    return (
        <div className="section bridge-panel">
            <div className="row chains-row">
                {renderChainBox(fromChain, 'From')}
                <div className="arrow" onClick={() => setChains([toChain, fromChain])}>
                    <SwapHoriz/>
                </div>
                {renderChainBox(toChain, 'To')}
            </div>
            {!showModify && (isRegistered || !isConnected) ? (
                <>
                    <div className="row center-aligned-row">
                        <div className="item item-group">
                            <div className="item-title">Token</div>
                            <div className="item-text">
                                <Dropdown id="token-select" withCaret={true}
                                          items={_.map(supportedTokens, t => ({name: t}))}
                                          onItemClick={onTokenChange}>
                                    {selectedSymbol}
                                </Dropdown>
                            </div>
                        </div>
                        <div className="slider">
                            <Slider disabled={disabled} marks={{0: '0%', 25: '25%', 50: '50%', 75: '75%', 100: '100%'}}
                                    value={Math.round(amount / balance * 100)}
                                    onChange={onSliderChange}
                            />
                        </div>
                    </div>
                    <div className="row input-container">
                        <div className="item">
                            <div className="item-title">
                                <span>Amount</span>
                                <span>
                                  Max: <span className="max-balance"
                                             onClick={() => !disabled && setAmount(balance.toFixed(token.precision))}>
                                      {amountToAsset(balance, selectedSymbol, false, true)}
                                  </span>
                              </span>
                            </div>
                            <div className="item-input">
                                <input disabled={disabled} type="text" className="input" value={amount}
                                       onChange={e => setAmount(parseFloat(e.target.value).toFixed(6))}/>
                            </div>
                        </div>
                    </div>
                    <div className="row" style={{textAlign: 'right'}}>
                        <Button disabled={disabled} variant="contained" color="default"
                                onClick={() => console.log('SEND TOKENS')}>
                            Send Tokens
                        </Button>
                    </div>
                </>
            ) : (
                <BridgeRegister registerOn={registerOn} controller={controllers[registerOn]} isModify={showModify}/>
            )}
            <div className="toolbar">
                {showModify && (
                    <FontAwesomeIcon icon={faTimes} onClick={() => setShowModify(false)}/>
                )}
                {!showModify && isConnected && isRegistered && (
                    <FontAwesomeIcon icon={faAddressBook} title="Change registered Ethereum address" onClick={() => setShowModify(true)}/>
                )}
                <FontAwesomeIcon icon={faSync} title="Refresh fees" onClick={() => console.log('sync prices')}/>
            </div>
        </div>
    )
}

export default Bridge