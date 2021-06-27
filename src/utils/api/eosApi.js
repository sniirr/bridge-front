import _ from "lodash";

export const fetchTableData = async (rpc, opts) => rpc.get_table_rows({
    json: true,                 // Get the response as json
    limit: 10,                  // Maximum number of rows that we want to get
    reverse: false,             // Optional: Get reversed data
    show_payer: false,          // Optional: Show ram payer
    ...opts,
})

export const fetchOne = async (rpc, opts) => {
    const res = await fetchTableData(rpc, {...opts, limit: 1})
    return _.get(res, ['rows', 0])
}

export const fetchOneByPk = async (rpc, opts, pkFieldName, pk) => {
    const res = await fetchTableData(rpc, {...opts, lower_bound: pk, limit: 1})

    let processedData = res
    const row = _.get(res, ['rows', 0])
    if (!_.isNil(row) && !_.isEmpty(pkFieldName)) {
        if (row[pkFieldName] !== pk) {
            processedData = {rows: []}
        }
    }

    return _.get(processedData, ['rows', 0])
}

// txs
export const createTransferAction = (from, quantity, {contract, symbol}, to, memo) => {
    return {
        account: contract,
        name: 'transfer',
        data: {
            from,
            to,
            quantity,
            memo: memo || from,
        },
    }
}