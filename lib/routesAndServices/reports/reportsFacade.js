const service = require('./reportsService')


function getTotalVolume(details) {

    return service.getTotalVolume(details).then(data => data)
}

function getTotalPayoutVolume(details) {

    return service.getTotalPayoutVolume(details).then(data => data)
}


module.exports = {
    getTotalVolume,
    getTotalPayoutVolume
}