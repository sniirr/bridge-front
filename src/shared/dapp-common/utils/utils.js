import _ from "lodash";
import numeral from 'numeral'

export const getMethod = (controllers, chainKey, method) => {
    const ctrl = controllers[chainKey]
    if (!_.isFunction(ctrl[method])) {
        throw `NotImplementedError: ${method} is not implemented for ${chainKey}`
    }

    return ctrl[method]
}

export const getHandler = (controllers, chainKey, methodName, state, mapContext = () => ({})) => {
    const ctrl = controllers[chainKey]
    if (!_.isFunction(ctrl[methodName])) {
        throw `NotImplementedError: ${methodName} is not implemented for ${chainKey}`
    }
    const method = getMethod(controllers, chainKey, methodName)

    const chain = !_.isEmpty(state) ? _.get(state, ['chains', chainKey], {}) : null
    const account = !_.isEmpty(state) ? _.get(state, ['accounts', chainKey], {}) : null
    const tokens = !_.isEmpty(state) ? _.get(state, 'tokens', {}) : null

    const context = {
        chain,
        account,
        tokens,
        ...mapContext(state),
    }

    return {
        handler: method(context),
        context,
    }
}

export const showNotification = ({ type, text }) => ({
    type: 'NOTIFICATION.SHOW',
    payload: {type, text}
})

export const removeNotification = () => ({
    type: 'NOTIFICATION.REMOVE'
})

export const toFloat = (input, decimal = 6) => {
    let output = input.toString();
    output = output.slice(0, (output.indexOf(".")) + decimal + 1);
    return Number(output);
}

const precisions = _.uniq([2, 4, 6, 18])

const generateFormat = p => {
    if (p === 0) return '0'
    let ps = '0.'
    for (let i = 0; i < p; i++) {
        ps += '0'
    }
    return ps
}

const PRECISION_FORMAT = _.zipObject(
    precisions,
    _.map(precisions, generateFormat)
)

const getFormat = p => {
    return _.has(PRECISION_FORMAT, p) ? PRECISION_FORMAT[p] : generateFormat(p)
}

export const amountToAsset = (amount, {symbol, precision}, withSymbol = true, prettify = false, overridePrecision = -1) => {
    const p = overridePrecision === -1 ? precision : overridePrecision
    const f = getFormat(p)
    const format = prettify ? '0,' + f : f
    const num = numeral(_.isString(amount) ? parseFloat(amount) : amount)
    return `${num.format(format)}${withSymbol ? (' ' + symbol) : ''}`
}

export const removeComma = v => (v + '').replace(/\,/g, '')

export const poll = async opts => {
    const {interval, pollFunc, checkFunc, timerId, setTimerId} = opts
    try {
        const res = await pollFunc()
        const shouldStop = _.isFunction(checkFunc) && checkFunc(res)

        if (!shouldStop) {
            if (timerId !== -1) {
                clearTimeout(timerId)
            }
            setTimerId(
                setTimeout(() => {
                    poll(opts)
                }, interval)
            )
        }
    }
    catch (e) {

    }
}