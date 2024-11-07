const gatewayDao = require("./gatewayDao");

async function addGateway(tx)
{
    const newSettlement = await gatewayDao.addGateway(tx)
    return newSettlement
}

module.exports={
    addGateway
}