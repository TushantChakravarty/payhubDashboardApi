const { Settlements } = require("../../generic/models/settlementsModel")
async function createSettlementTransaction(tx)
{
    const newTransaction = new Settlements(tx);
    
    // Save the transaction
    const updated = await newTransaction.save()
        .catch(error => {
            console.error('Error:', error);
        });
        return updated
}

module.exports={
    createSettlementTransaction
}