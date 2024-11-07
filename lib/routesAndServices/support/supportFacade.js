const service = require('./supportService')

async function getAllMerchants(details)
{
    return service.getAllMerchants(details).then(data => data)
}

async function addAgent(details)
{
    return service.addAgent(details).then(data => data)
}

async function verifyAgent(details)
{
    return service.verifyAgent(details).then(data => data)
}

async function getTransactionGatewayData(details)
{
    return service.getTransactionGatewayData(details).then(data => data)
}

async function resolveQuery(details)
{
    return service.resolveQuery(details).then(data => data)
}

module.exports ={
    getAllMerchants,

    addAgent,

    verifyAgent,

    getTransactionGatewayData,

    resolveQuery
}