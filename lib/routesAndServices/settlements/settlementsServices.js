const { createSettlementTransaction } = require("./settlementsDao");

async function createSettlements(tx)
{
    const newSettlement = await createSettlementTransaction(tx)
    return newSettlement
}

module.exports={
    createSettlements
}