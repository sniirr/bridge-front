import _ from 'lodash'
import numeral from 'numeral'

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