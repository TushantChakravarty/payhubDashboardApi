

/*#################################            Load modules start            ########################################### */
const service = require('./adminService')
const callbackService = require("../callbacks/callbackServices")
/*#################################            Load modules end            ########################################### */





/**
 * Register user
 * @param {Object} details user details to get registered
 */
function register(details) {

    return service.register(details).then(data => data)
}


/**
 * Login
 * @param {Object} details user details
 */
function login(details) {

    return service.login(details).then(data => data)
}

function resetPassword(details) {

    return service.resetPassword(details).then(data => data)
}


function getAllUserTransactions(details) {

    return service.getAllUserTransactions(details).then(data => data)
}

function getUserTransactionData(details) {

    return service.getUserTransactionData(details).then(data => data)
}

function getAllUsersTransactions(details) {

    return service.getAllUsersTransactions(details).then(data => data)
}

function getAllTx(details) {

    return service.getAllTx(details).then(data => data)
}
function getProfileData(details) {

    return service.getProfileData(details).then(data => data)
}
function updateUserProfile(details) {

    return service.updateUserProfile(details).then(data => data)
}
function saveTx(details) {

    return service.saveTx(details).then(data => data)
}

function saveTxBazarpay(details) {

    return service.saveTxBazapay(details).then(data => data)
}
function saveTxIntentpay(details) {

    return service.saveTxIntentpay(details).then(data => data)
}

function saveTxPaythrough(details) {

    return service.saveTxPaythrough(details).then(data => data)
}

function saveTxPhonepe(details) {

    return service.saveTxPhonepe(details).then(data => data)
}

function updateGateway(details) {

    return service.updateGateway(details).then(data => data)
}

function getAdminBalance(details) {

    return service.getAdminBalance(details).then(data => data)
}

function settleMoney(details) {

    return service.settleMoney(details).then(data => data)
}

function getSuccessfulMerchantTransactions(details) {

    return service.getSuccessfulMerchantTransactions(details).then(data => data)
}

function getAllMerchantsData(details) {

    return service.getAllMerchantsData(details).then(data => data)
}

function updatePremium(details) {

    return service.updatePremium(details).then(data => data)
}

function getAllUserSettlements(details) {

    return service.getAllUserSettlements(details).then(data => data)
}

function getUserBalance(details) {

    return service.getUserBalance(details).then(data => data)
}

function updateGatewayPremium(details) {

    return service.updateGatewayPremium(details).then(data => data)
}

function getDataByUtr(details) {

    return service.getDataByUtr(details).then(data => data)
}

function getTransactionsUser(details) {

    return service.getTransactionsUser(details).then(data => data)
}
function getTransactionsByStatus(details) {

    return service.getTransactionsByStatus(details).then(data => data)
}

function getTransactionsByDate(details) {

    return service.getTransactionsByDate(details).then(data => data)
}

function getAllMerchantTransactions(details) {

    return service.getAllMerchantTransactions(details).then(data => data)
}
function getMerchantTransactionByUtr(details) {

    return service.getMerchantTransactionByUtr(details).then(data => data)
}

function getAllMerchantsInfo(details) {

    return service.getAllMerchantsInfo(details).then(data => data)
}

function sendPaymentRequest(details) {

    return service.sendPaymentRequest(details).then(data => data)
}

function getLast24HourData(details) {

    return service.getLast24HourData(details).then(data => data)
}

function updateGatewayFee(details) {

    return service.updateGatewayFee(details).then(data => data)
}

function updatePlatformFee(details) {

    return service.updatePlatformFee(details).then(data => data)
}

function updateGatewayData(details) {

    return service.updateGatewayData(details).then(data => data)
}

function getGatewayDetails(details) {

    return service.getGatewayDetails(details).then(data => data)
}

function getGatewayInfo(details) {

    return service.getGatewayInfo(details).then(data => data)
}

function updateGatewayFees(details) {

    return service.updateGatewayFees(details).then(data => data)
}

function saveTxAirpay(details) {
    
    return callbackService.saveTxAirpay(details).then(data => data)
}
function getAllMerchantsStats(details) {

    return service.getAllMerchantsStats(details).then(data => data)
}

function getAllPayoutMerchantsStats(details) {

    return service.getAllPayoutMerchantsStats(details).then(data => data)
}

function getMerchantData(details) {

    return service.getMerchantData(details).then(data => data)
}

function getMerchantTopupData(details) {

    return service.getMerchantPayoutAndTopupData(details).then(data => data)
}

function getUserSettlements(details) {

    return service.getUserSettlements(details).then(data => data)
}
function getMerchantTransactionsByDate(details) {

    return service.getMerchantTransactionsByDate(details).then(data => data)
}
function getUserTransactionByUtr(details) {

    return service.getUserTransactionByUtr(details).then(data => data)
}

function getallmerchantstats(details) {

    return service.getAllMerchantsDetails(details).then(data => data)
}

function getAllTransactionsByStatus(details) {

    return service.getAllTransactionsByStatus(details).then(data => data)
}
function saveTxSwipeline(details) {

    return service.saveTxSwipeline(details).then(data => data)
}

function updatePayoutGateway(details) {

    return service.updatePayoutGateway(details).then(data => data)
}

function getMerchantLogs(details) {

    return service.getMerchantLogs(details).then(data => data)
}

function getMerchantTotalSettlementsAndVolume(details) {

    return service.getMerchantTotalSettlementsAndVolume(details).then(data => data)
}

function getMerchantTotalPayoutAndTopup(details) {

    return service.getMerchantTotalPayoutAndTopup(details).then(data => data)
}

function banMerchant(details) {

    return service.banMerchant(details).then(data => data)
}

function updateProfileData(details) {

    return service.updateProfileData(details).then(data => data)
}

function getTotalGatewayVolume(details) {

    return service.getTotalGatewayVolume(details).then(data => data)
}

function getTotalVolumeCheck(details) {

    return service.getTotalVolumeCheck(details).then(data => data)
}

function getTotalVolumeMerchantCheck(details) {

    return service.getTotalVolumeMerchantCheck(details).then(data => data)
}

function updateVolumeData(details) {

    return service.updateVolumeData(details).then(data => data)
}

function getAllGateways(details) {

    return service.getAllGateways(details).then(data => data)
}

function updateGatewaySettlements(details) {

    return service.updateGatewaySettlements(details).then(data => data)
}

function getAllGatewaysSettlements(details) {

    return service.getAllGatewaysSettlements(details).then(data => data)
}

function getGatewaySettlements(details) {

    return service.getGatewaySettlements(details).then(data => data)
}

function getGatewayVolume(details) {

    return service.getGatewayVolume(details).then(data => data)
}

function getTotalGatewayVolume(details) {

    return service.getTotalGatewayVolume(details).then(data => data)
}
function setGatewaySwitch(details) {

    return service.setGatewaySwitch(details).then(data => data)
}

function verifyPageExpiryToken(details) {

    return service.verifyPageExpiryToken(details).then(data => data)
}


function getTransactinTime(details) {

    return service.getTransactinTime(details).then(data => data)
}

function getTransactinStatus(details) {

    return service.getTransactinStatus(details).then(data => data)
}

function updatePayoutBalance(details) {

    return service.updatePayoutBalance(details
    ).then(data => data)
}

function resetMerchantPassword(details) {

    return service.resetMerchantPassword(details).then(data => data)
}


/**
 * Add sales
 * @param {Object} details user details to get registered
 */
async function addSales(req, res) {
    try {
        await service.addSales(req, res)
    } catch (err) {
        return res.send({
            responseCode: 500,
            responseMessage: "Your request couldn't be processed,please try again!"
        });
    }
}


/**
 * Add sales
 * @param {Object} details user details to get registered
 */
async function addIp(req, res) {
    try {
        await service.addIp(req, res)
    } catch (err) {
        return res.send({
            responseCode: 500,
            responseMessage: "Your request couldn't be processed,please try again!"
        });
    }
}
/**
 * Add sales
 * @param {Object} details user details to get registered
 */
async function allMerchants(req, res) {
    try {
        await service.allMerchants(req, res)
    } catch (err) {
        return res.send({
            responseCode: 500,
            responseMessage: "Your request couldn't be processed,please try again!"
        });
    }
}

/**
 * All sales
 * @param {Object} details user details to get registered
 */
async function allSales(req, res) {
    try {
        await service.allSales(req, res)
    } catch (err) {
        return res.send({
            responseCode: 500,
            responseMessage: "Your request couldn't be processed,please try again!"
        });
    }
}

async function editSales(req, res) {
    try {
        await service.editSales(req, res)
    } catch (err) {
        return res.send({
            responseCode: 500,
            responseMessage: "Your request couldn't be processed,please try again!"
        });
    }
}


async function deleteSales(req, res) {
    try {
        await service.deleteSales(req, res)
    } catch (err) {
        return res.send({
            responseCode: 500,
            responseMessage: "Your request couldn't be processed,please try again!"
        });
    }
}


// TOP UP SECTION START

async function addTopup(req,res){
    try{
        await service.addTopup(req, res)
    }catch(err){
        return res.send({
            responseCode: 500,
            responseMessage: "Your request couldn't be processed,please try again!"
        })
    }

}

// async function getUsersTopup(req,res){
//     try{
//         return service.updateGatewaySettlements(details).then(data => data)
//         await service.getUsersTopup(req.body)
//     }catch(err){
//         return res.send({
//             responseCode: 500,
//             responseMessage: "Your request couldn't be processed,please try again!"
//         })
//     }

// }
function getUsersTopup(details) {

    return service.getUserTopups(details).then(data => data)
}

function setDailyLimit(details) {

    return service.setDailyLimit(details).then(data => data)
}

function downloadCsvByDate(details) {

    return service.downloadCsvByDate(details).then(data => data)
}

function downloadCsvForAll(details) {

    return service.downloadCsvForAll(details).then(data => data)
}

function downloadCsvForMerchant(details) {

    return service.downloadCsvForMerchant(details).then(data => data)
}

function downloadCsvForMerchantByStatus(details) {

    return service.downloadCsvForMerchantByStatus(details).then(data => data)
}

function downloadCsvByStatus(details) {

    return service.downloadCsvByStatus(details).then(data => data)
}

function downloadCsvByDateAndStatus(details) {

    return service.downloadCsvByDateAndStatus(details).then(data => data)
}

function downloadMerchantCsvByDate(details) {

    return service.downloadMerchantCsvByDate(details).then(data => data)
}

function downloadMerchantCsvByDateAndStatus(details) {

    return service.downloadMerchantCsvByDateAndStatus(details).then(data => data)
}


function downloadSettlementCsvByDate(details) {

    return service.downloadSettlementTransactionsByDateWithStatusCsv(details).then(data => data)
}

function downloadGatewaySettlementCsvByDate(details) {

    return service.downloadGatewaySettlementTransactionsByDateWithStatusCsv(details).then(data => data)
}

//payouts

function activatePayout(details) {

    return service.activatePayout(details).then(data => data)
}


async function newSettleMoney(req) {
   try{
    return await service.newSettleMoney(req.body)

   }catch(error){
        throw error
   }
}

async function getMerchantSettlementByType(req) {
    try{
     return await service.getMerchantSettlementByType(req.body)
 
    }catch(error){
         throw error
    }
 }

module.exports = {
    getMerchantSettlementByType,

    register,

    login,

    resetPassword,

    getAllUsersTransactions,

    getProfileData,

    updateUserProfile,

    saveTx,

    saveTxBazarpay,

    saveTxIntentpay,

    updateGateway,

    getAllTx,

    getUserTransactionData,

    getAdminBalance,

    settleMoney,

    getSuccessfulMerchantTransactions,

    saveTxPaythrough,

    getAllMerchantsData,

    updatePremium,

    getAllUserSettlements,

    getUserBalance,

    updateGatewayPremium,

    getDataByUtr,

    getTransactionsUser,

    getTransactionsByStatus,

    getTransactionsByDate,

    getAllMerchantTransactions,

    getMerchantTransactionByUtr,

    getAllMerchantsInfo,

    sendPaymentRequest,

    getLast24HourData,

    updateGatewayFee,

    updatePlatformFee,

    updateGatewayData,

    getGatewayDetails,

    getGatewayInfo,

    updateGatewayFees,

    saveTxAirpay,

    getAllMerchantsStats,

    getMerchantData,

    getUserSettlements,

    getMerchantTransactionsByDate,

    getUserTransactionByUtr,

    getallmerchantstats,

    getAllTransactionsByStatus,

    saveTxSwipeline,

    updatePayoutGateway,

    getMerchantLogs,

    getMerchantTotalSettlementsAndVolume,

    banMerchant,

    saveTxPhonepe,

    updateProfileData,

    getTotalGatewayVolume,

    getTotalVolumeCheck,

    getTotalVolumeMerchantCheck,

    updateVolumeData,

    getAllGateways,

    updateGatewaySettlements,

    getAllGatewaysSettlements,

    getGatewaySettlements,

    getGatewayVolume,

    setGatewaySwitch,

    verifyPageExpiryToken,

    getTransactinTime,

    getTransactinStatus,

    updatePayoutBalance,

    resetMerchantPassword,

    addSales,

    allMerchants,

    allSales,

    editSales,

    deleteSales,

    addTopup,

    getMerchantTotalPayoutAndTopup,

    getUsersTopup,

    getMerchantTopupData,

    activatePayout,

    getAllPayoutMerchantsStats,

    setDailyLimit,

    downloadCsvByDate,

    downloadCsvForAll,

    downloadCsvForMerchant,

    downloadCsvForMerchantByStatus,

    downloadCsvByStatus,

    downloadCsvByDateAndStatus,

    downloadMerchantCsvByDate,

    downloadMerchantCsvByDateAndStatus,

    addIp,

    downloadSettlementCsvByDate,

    downloadGatewaySettlementCsvByDate,

    newSettleMoney

}
//exp://wz-erk.tushant07.munziapp.exp.direct:80