const router = require("express").Router();
const facade = require('./adminFacade');
const validators = require('../utils/userValidators');
const usrConst = require('../utils/userConstants');
const mapper = require('../utils/userMapper');
const { genUsrToken } = require('../../jwtHandler');
const auth = require('../../middleware/auth')
const appUtils = require("../../appUtils");

const Sales = require("../../generic/models/salesModel")
const User = require("../../generic/models/userModel");
const { validateRequest } = require("./adminService");




// router.route('/register').post((req, res) => {

//     let details = req.body
//     console.log(req.body)
//     facade.register(details).then((result) => {

//         res.send(result)
//     }).catch((err) => {

//         console.log({ err })
//         res.send(mapper.responseMapping(usrConst.CODE.INTRNLSRVR, usrConst.MESSAGE.internalServerError))
//     })
// })


router.route('/login').post((req, res) => {

    let details = req.body

    facade.login(details).then((result) => {
        console.log(result)
        res.send(result)
    }).catch((err) => {
        console.log({ err })
        res.send(mapper.responseMapping(usrConst.CODE.INTRNLSRVR, usrConst.MESSAGE.internalServerError))
    })
})




router.route('/forgotPassword').post((req, res) => {


    facade.resetPassword(req.body).then((result) => {

        res.send(result)
    }).catch((err) => {

        console.log({ err })
        res.send(mapper.responseMapping(usrConst.CODE.INTRNLSRVR, usrConst.MESSAGE.internalServerError))
    })
})


router.route('/getAllUserTransactions').post((req, res) => {



    facade.getAllUserTransactions(req.body).then((result) => {

        res.send(result)
    }).catch((err) => {

        console.log({ err })
        res.send(mapper.responseMapping(usrConst.CODE.INTRNLSRVR, usrConst.MESSAGE.internalServerError))
    })
})

router.route('/getAllTransactions').post((req, res) => {



    facade.getAllUsersTransactions(req.body).then((result) => {

        res.send(result)
    }).catch((err) => {

        console.log({ err })
        res.send(mapper.responseMapping(usrConst.CODE.INTRNLSRVR, usrConst.MESSAGE.internalServerError))
    })
})

router.route('/getAllTxDetails').post((req, res) => {



    facade.getAllTx(req.body).then((result) => {

        res.send(result)
    }).catch((err) => {

        console.log({ err })
        res.send(mapper.responseMapping(usrConst.CODE.INTRNLSRVR, usrConst.MESSAGE.internalServerError))
    })
})

router.route('/getUsertransactiondata').post((req, res) => {



    facade.getUserTransactionData(req.body).then((result) => {

        res.send(result)
    }).catch((err) => {

        console.log({ err })
        res.send(mapper.responseMapping(usrConst.CODE.INTRNLSRVR, usrConst.MESSAGE.internalServerError))
    })
})

router.route('/getadminbalance').post((req, res) => {



    facade.getAdminBalance(req.body).then((result) => {

        res.send(result)
    }).catch((err) => {

        console.log({ err })
        res.send(mapper.responseMapping(usrConst.CODE.INTRNLSRVR, usrConst.MESSAGE.internalServerError))
    })
})

router.route('/settlemoney').post((req, res) => {

    facade.settleMoney(req.body).then((result) => {
        res.send(result)
    }).catch((err) => {

        console.log({ err })
        res.send(mapper.responseMapping(usrConst.CODE.INTRNLSRVR, usrConst.MESSAGE.internalServerError))
    })
})


router.route('/writetest').post(appUtils.attachUserMiddleware, (req, res, next) => {
    req.accessFields = ['settlementWrite']; // Example of required access fields
    next();
},appUtils.rbamMiddleware,(req, res) => {
    return res.send({"message":"write test  is successfull"})
})

router.route('/readtest').post((req, res) => {
    return res.send({"message":"read test  is successfull"})
})


router.route('/getsuccessfulmerchantstransactions').post((req, res) => {



    facade.getSuccessfulMerchantTransactions(req.body).then((result) => {

        res.send(result)
    }).catch((err) => {

        console.log({ err })
        res.send(mapper.responseMapping(usrConst.CODE.INTRNLSRVR, usrConst.MESSAGE.internalServerError))
    })
})

router.route('/getallmerchantsdata').post((req, res) => {



    facade.getAllMerchantsData(req.body).then((result) => {

        res.send(result)
    }).catch((err) => {

        console.log({ err })
        res.send(mapper.responseMapping(usrConst.CODE.INTRNLSRVR, usrConst.MESSAGE.internalServerError))
    })
})

router.route('/getProfile').post((req, res) => {



    facade.getProfileData(req.body).then((result) => {

        res.send(result)
    }).catch((err) => {

        console.log({ err })
        res.send(mapper.responseMapping(usrConst.CODE.INTRNLSRVR, usrConst.MESSAGE.internalServerError))
    })
})


router.route('/updateuserprofile').post((req, res) => {



    facade.updateUserProfile(req.body).then((result) => {

        res.send(result)
    }).catch((err) => {

        console.log({ err })
        res.send(mapper.responseMapping(usrConst.CODE.INTRNLSRVR, usrConst.MESSAGE.internalServerError))
    })
})


router.route('/updatepremium').post((req, res) => {



    facade.updatePremium(req.body).then((result) => {

        res.send(result)
    }).catch((err) => {

        console.log({ err })
        res.send(mapper.responseMapping(usrConst.CODE.INTRNLSRVR, usrConst.MESSAGE.internalServerError))
    })
})

router.route('/saveTx').post((req, res) => {



    facade.saveTx(req.body).then((result) => {

        res.send(result)
    }).catch((err) => {

        console.log({ err })
        res.send(mapper.responseMapping(usrConst.CODE.INTRNLSRVR, usrConst.MESSAGE.internalServerError))
    })
})


router.route('/saveTxBazarpay').post((req, res) => {



    facade.saveTxBazarpay(req.body).then((result) => {

        res.send(result)
    }).catch((err) => {

        console.log({ err })
        res.send(mapper.responseMapping(usrConst.CODE.INTRNLSRVR, usrConst.MESSAGE.internalServerError))
    })
})

router.route('/savetxintentpay').post((req, res) => {



    facade.saveTxIntentpay(req.body).then((result) => {

        res.send(result)
    }).catch((err) => {

        console.log({ err })
        res.send(mapper.responseMapping(usrConst.CODE.INTRNLSRVR, usrConst.MESSAGE.internalServerError))
    })
})

router.route('/savetxpaythrough').post((req, res) => {



    facade.saveTxPaythrough(req.body).then((result) => {

        res.send(result)
    }).catch((err) => {

        console.log({ err })
        res.send(mapper.responseMapping(usrConst.CODE.INTRNLSRVR, usrConst.MESSAGE.internalServerError))
    })
})

router.route('/updategateway').post((req, res) => {



    facade.updateGateway(req.body).then((result) => {

        res.send(result)
    }).catch((err) => {

        console.log({ err })
        res.send(mapper.responseMapping(usrConst.CODE.INTRNLSRVR, usrConst.MESSAGE.internalServerError))
    })
})

router.route('/updategatewaypremium').post((req, res) => {



    facade.updateGatewayPremium(req.body).then((result) => {

        res.send(result)
    }).catch((err) => {

        console.log({ err })
        res.send(mapper.responseMapping(usrConst.CODE.INTRNLSRVR, usrConst.MESSAGE.internalServerError))
    })
})


router.route('/getallusersettlements').post((req, res) => {



    facade.getAllUserSettlements(req.body).then((result) => {

        res.send(result)
    }).catch((err) => {

        console.log({ err })
        res.send(mapper.responseMapping(usrConst.CODE.INTRNLSRVR, usrConst.MESSAGE.internalServerError))
    })
})

router.route('/getuserbalance').post((req, res) => {



    facade.getUserBalance(req.body).then((result) => {

        res.send(result)
    }).catch((err) => {

        console.log({ err })
        res.send(mapper.responseMapping(usrConst.CODE.INTRNLSRVR, usrConst.MESSAGE.internalServerError))
    })
})

router.route('/getdatabyutr').post((req, res) => {



    facade.getDataByUtr(req.body).then((result) => {

        res.send(result)
    }).catch((err) => {

        console.log({ err })
        res.send(mapper.responseMapping(usrConst.CODE.INTRNLSRVR, usrConst.MESSAGE.internalServerError))
    })
})

router.route('/getUserTransactions').post((req, res) => {



    facade.getTransactionsUser(req.body).then((result) => {

        res.send(result)
    }).catch((err) => {

        console.log({ err })
        res.send(mapper.responseMapping(usrConst.CODE.INTRNLSRVR, usrConst.MESSAGE.internalServerError))
    })
})


router.route('/getUserTransactionsByStatus').post((req, res) => {



    facade.getTransactionsByStatus(req.body).then((result) => {

        res.send(result)
    }).catch((err) => {

        console.log({ err })
        res.send(mapper.responseMapping(usrConst.CODE.INTRNLSRVR, usrConst.MESSAGE.internalServerError))
    })
})


router.route('/getUserTransactionsByDate').post((req, res) => {



    facade.getTransactionsByDate(req.body).then((result) => {

        res.send(result)
    }).catch((err) => {

        console.log({ err })
        res.send(mapper.responseMapping(usrConst.CODE.INTRNLSRVR, usrConst.MESSAGE.internalServerError))
    })
})

router.route('/getAllMerchantTransactions').post((req, res) => {



    facade.getAllMerchantTransactions(req.body).then((result) => {

        res.send(result)
    }).catch((err) => {

        console.log({ err })
        res.send(mapper.responseMapping(usrConst.CODE.INTRNLSRVR, usrConst.MESSAGE.internalServerError))
    })
})

router.route('/getMerchantTransactionByUtr').post((req, res) => {



    facade.getMerchantTransactionByUtr(req.body).then((result) => {

        res.send(result)
    }).catch((err) => {

        console.log({ err })
        res.send(mapper.responseMapping(usrConst.CODE.INTRNLSRVR, usrConst.MESSAGE.internalServerError))
    })
})

router.route('/getUserTransactionByUtr').post((req, res) => {



    facade.getUserTransactionByUtr(req.body).then((result) => {

        res.send(result)
    }).catch((err) => {

        console.log({ err })
        res.send(mapper.responseMapping(usrConst.CODE.INTRNLSRVR, usrConst.MESSAGE.internalServerError))
    })
})

router.route('/getAllMerchantsInfo').post((req, res) => {



    facade.getAllMerchantsInfo(req.body).then((result) => {

        res.send(result)
    }).catch((err) => {

        console.log({ err })
        res.send(mapper.responseMapping(usrConst.CODE.INTRNLSRVR, usrConst.MESSAGE.internalServerError))
    })
})



router.route('/getlast24hourdata').post((req, res) => {



    facade.getLast24HourData(req.body).then((result) => {

        res.send(result)
    }).catch((err) => {

        console.log({ err })
        res.send(mapper.responseMapping(usrConst.CODE.INTRNLSRVR, usrConst.MESSAGE.internalServerError))
    })
})
router.route('/updateusergatewayfee').post((req, res) => {



    facade.updateGatewayFee(req.body).then((result) => {

        res.send(result)
    }).catch((err) => {

        console.log({ err })
        res.send(mapper.responseMapping(usrConst.CODE.INTRNLSRVR, usrConst.MESSAGE.internalServerError))
    })
})
router.route('/updateplatformfee').post((req, res) => {



    facade.updatePlatformFee(req.body).then((result) => {

        res.send(result)
    }).catch((err) => {

        console.log({ err })
        res.send(mapper.responseMapping(usrConst.CODE.INTRNLSRVR, usrConst.MESSAGE.internalServerError))
    })
})

router.route('/addGateway').post((req, res) => {



    facade.updateGatewayData(req.body).then((result) => {

        res.send(result)
    }).catch((err) => {

        console.log({ err })
        res.send(mapper.responseMapping(usrConst.CODE.INTRNLSRVR, usrConst.MESSAGE.internalServerError))
    })
})

router.route('/getgatewaydetails').post((req, res) => {



    facade.getGatewayDetails(req.body).then((result) => {

        res.send(result)
    }).catch((err) => {

        console.log({ err })
        res.send(mapper.responseMapping(usrConst.CODE.INTRNLSRVR, usrConst.MESSAGE.internalServerError))
    })
})

router.route('/getgatewayInfo').post((req, res) => {



    facade.getGatewayInfo(req.body).then((result) => {

        res.send(result)
    }).catch((err) => {

        console.log({ err })
        res.send(mapper.responseMapping(usrConst.CODE.INTRNLSRVR, usrConst.MESSAGE.internalServerError))
    })
})
router.route('/updategatewayfees').post((req, res) => {



    facade.updateGatewayFees(req.body).then((result) => {

        res.send(result)
    }).catch((err) => {

        console.log({ err })
        res.send(mapper.responseMapping(usrConst.CODE.INTRNLSRVR, usrConst.MESSAGE.internalServerError))
    })
})

router.route('/savetxairpay').post((req, res) => {



    facade.saveTxAirpay(req.body).then((result) => {

        res.send(result)
    }).catch((err) => {

        console.log({ err })
        res.send(mapper.responseMapping(usrConst.CODE.INTRNLSRVR, usrConst.MESSAGE.internalServerError))
    })
})

router.route('/savetxphonepe').post((req, res) => {



    facade.saveTxPhonepe(req.body).then((result) => {

        res.send(result)
    }).catch((err) => {

        console.log({ err })
        res.send(mapper.responseMapping(usrConst.CODE.INTRNLSRVR, usrConst.MESSAGE.internalServerError))
    })
})

router.route('/getallmerchantlist').post((req, res) => {



    facade.getAllMerchantsStats(req.body).then((result) => {

        res.send(result)
    }).catch((err) => {

        console.log({ err })
        res.send(mapper.responseMapping(usrConst.CODE.INTRNLSRVR, usrConst.MESSAGE.internalServerError))
    })
})

router.route('/getallpayoutmerchantlist').post((req, res) => {



    facade.getAllPayoutMerchantsStats(req.body).then((result) => {

        res.send(result)
    }).catch((err) => {

        console.log({ err })
        res.send(mapper.responseMapping(usrConst.CODE.INTRNLSRVR, usrConst.MESSAGE.internalServerError))
    })
})

router.route('/getmerchantdata').post((req, res) => {



    facade.getMerchantData(req.body).then((result) => {

        res.send(result)
    }).catch((err) => {

        console.log({ err })
        res.send(mapper.responseMapping(usrConst.CODE.INTRNLSRVR, usrConst.MESSAGE.internalServerError))
    })
})
router.route('/getmerchanttopupdata').post((req, res) => {



    facade.getMerchantTopupData(req.body).then((result) => {

        res.send(result)
    }).catch((err) => {

        console.log({ err })
        res.send(mapper.responseMapping(usrConst.CODE.INTRNLSRVR, usrConst.MESSAGE.internalServerError))
    })
})

router.route('/getmerchantsettlements').post((req, res) => {



    facade.getUserSettlements(req.body).then((result) => {

        res.send(result)
    }).catch((err) => {

        console.log({ err })
        res.send(mapper.responseMapping(usrConst.CODE.INTRNLSRVR, usrConst.MESSAGE.internalServerError))
    })
})
router.route('/getmerchanttransactionbydate').post((req, res) => {



    facade.getMerchantTransactionsByDate(req.body).then((result) => {

        res.send(result)
    }).catch((err) => {

        console.log({ err })
        res.send(mapper.responseMapping(usrConst.CODE.INTRNLSRVR, usrConst.MESSAGE.internalServerError))
    })
})

router.route('/getallmerchantsstats').post((req, res) => {



    facade.getallmerchantstats(req.body).then((result) => {

        res.send(result)
    }).catch((err) => {

        console.log({ err })
        res.send(mapper.responseMapping(usrConst.CODE.INTRNLSRVR, usrConst.MESSAGE.internalServerError))
    })
})

router.route('/getalltransactionsbystatus').post((req, res) => {



    facade.getAllTransactionsByStatus(req.body).then((result) => {

        res.send(result)
    }).catch((err) => {

        console.log({ err })
        res.send(mapper.responseMapping(usrConst.CODE.INTRNLSRVR, usrConst.MESSAGE.internalServerError))
    })
})

router.route('/savetxswipeline').post((req, res) => {



    facade.saveTxSwipeline(req.body).then((result) => {

        res.send(result)
    }).catch((err) => {

        console.log({ err })
        res.send(mapper.responseMapping(usrConst.CODE.INTRNLSRVR, usrConst.MESSAGE.internalServerError))
    })
})

router.route('/updatepayoutgateway').post((req, res) => {



    facade.updatePayoutGateway(req.body).then((result) => {

        res.send(result)
    }).catch((err) => {

        console.log({ err })
        res.send(mapper.responseMapping(usrConst.CODE.INTRNLSRVR, usrConst.MESSAGE.internalServerError))
    })
})

router.route('/getmerchantlogs').post((req, res) => {



    facade.getMerchantLogs(req.body).then((result) => {

        res.send(result)
    }).catch((err) => {

        console.log({ err })
        res.send(mapper.responseMapping(usrConst.CODE.INTRNLSRVR, usrConst.MESSAGE.internalServerError))
    })
})

router.route('/gettotalvolumeandsettlements').post((req, res) => {



    facade.getMerchantTotalSettlementsAndVolume(req.body).then((result) => {

        res.send(result)
    }).catch((err) => {

        console.log({ err })
        res.send(mapper.responseMapping(usrConst.CODE.INTRNLSRVR, usrConst.MESSAGE.internalServerError))
    })
})

router.route('/gettotalpayoutandtopup').post((req, res) => {



    facade.getMerchantTotalPayoutAndTopup(req.body).then((result) => {

        res.send(result)
    }).catch((err) => {

        console.log({ err })
        res.send(mapper.responseMapping(usrConst.CODE.INTRNLSRVR, usrConst.MESSAGE.internalServerError))
    })
})

router.route('/banmerchant').post((req, res) => {



    facade.banMerchant(req.body).then((result) => {

        res.send(result)
    }).catch((err) => {

        console.log({ err })
        res.send(mapper.responseMapping(usrConst.CODE.INTRNLSRVR, usrConst.MESSAGE.internalServerError))
    })
})

router.route('/updateuserprofiledata').post((req, res) => {



    facade.updateProfileData(req.body).then((result) => {

        res.send(result)
    }).catch((err) => {

        console.log({ err })
        res.send(mapper.responseMapping(usrConst.CODE.INTRNLSRVR, usrConst.MESSAGE.internalServerError))
    })
})

router.route('/gettotalgatewayvolume').post((req, res) => {



    facade.getTotalGatewayVolume(req.body).then((result) => {

        res.send(result)
    }).catch((err) => {

        console.log({ err })
        res.send(mapper.responseMapping(usrConst.CODE.INTRNLSRVR, usrConst.MESSAGE.internalServerError))
    })
})

router.route('/gettotalvolumecheck').post((req, res) => {



    facade.getTotalVolumeCheck(req.body).then((result) => {

        res.send(result)
    }).catch((err) => {

        console.log({ err })
        res.send(mapper.responseMapping(usrConst.CODE.INTRNLSRVR, usrConst.MESSAGE.internalServerError))
    })
})

router.route('/gettotalvolumemerchantcheck').post((req, res) => {



    facade.getTotalVolumeMerchantCheck(req.body).then((result) => {

        res.send(result)
    }).catch((err) => {

        console.log({ err })
        res.send(mapper.responseMapping(usrConst.CODE.INTRNLSRVR, usrConst.MESSAGE.internalServerError))
    })
})

router.route('/updatevolumedata').post((req, res) => {



    facade.updateVolumeData(req.body).then((result) => {

        res.send(result)
    }).catch((err) => {

        console.log({ err })
        res.send(mapper.responseMapping(usrConst.CODE.INTRNLSRVR, usrConst.MESSAGE.internalServerError))
    })
})

router.route('/getallgateways').post((req, res) => {



    facade.getAllGateways(req.body).then((result) => {

        res.send(result)
    }).catch((err) => {

        console.log({ err })
        res.send(mapper.responseMapping(usrConst.CODE.INTRNLSRVR, usrConst.MESSAGE.internalServerError))
    })
})

router.route('/updategatewaysettlements').post((req, res) => {



    facade.updateGatewaySettlements(req.body).then((result) => {

        res.send(result)
    }).catch((err) => {

        console.log({ err })
        res.send(mapper.responseMapping(usrConst.CODE.INTRNLSRVR, usrConst.MESSAGE.internalServerError))
    })
})

router.route('/getallgatewaysettlements').post((req, res) => {



    facade.getAllGatewaysSettlements(req.body).then((result) => {

        res.send(result)
    }).catch((err) => {

        console.log({ err })
        res.send(mapper.responseMapping(usrConst.CODE.INTRNLSRVR, usrConst.MESSAGE.internalServerError))
    })
})

router.route('/getgatewaysettlements').post((req, res) => {



    facade.getGatewaySettlements(req.body).then((result) => {

        res.send(result)
    }).catch((err) => {

        console.log({ err })
        res.send(mapper.responseMapping(usrConst.CODE.INTRNLSRVR, usrConst.MESSAGE.internalServerError))
    })
})

router.route('/getgatewayVolume').post((req, res) => {



    facade.getGatewayVolume(req.body).then((result) => {

        res.send(result)
    }).catch((err) => {

        console.log({ err })
        res.send(mapper.responseMapping(usrConst.CODE.INTRNLSRVR, usrConst.MESSAGE.internalServerError))
    })
})

router.route('/gettotalgatewayVolume').post((req, res) => {



    facade.getTotalGatewayVolume(req.body).then((result) => {

        res.send(result)
    }).catch((err) => {

        console.log({ err })
        res.send(mapper.responseMapping(usrConst.CODE.INTRNLSRVR, usrConst.MESSAGE.internalServerError))
    })
})

router.route('/setgatewayswitch').post((req, res) => {



    facade.setGatewaySwitch(req.body).then((result) => {

        res.send(result)
    }).catch((err) => {

        console.log({ err })
        res.send(mapper.responseMapping(usrConst.CODE.INTRNLSRVR, usrConst.MESSAGE.internalServerError))
    })
})

router.route('/verifyPageExpiryToken').post((req, res) => {



    facade.verifyPageExpiryToken(req.body).then((result) => {

        res.send(result)
    }).catch((err) => {

        console.log({ err })
        res.send(mapper.responseMapping(usrConst.CODE.INTRNLSRVR, usrConst.MESSAGE.internalServerError))
    })
})

router.route('/getTransactionTime').post((req, res) => {



    facade.getTransactinTime(req.body).then((result) => {

        res.send(result)
    }).catch((err) => {

        console.log({ err })
        res.send(mapper.responseMapping(usrConst.CODE.INTRNLSRVR, usrConst.MESSAGE.internalServerError))
    })
})

router.route('/getTransactionStatus').post((req, res) => {



    facade.getTransactinStatus(req.body).then((result) => {

        res.send(result)
    }).catch((err) => {

        console.log({ err })
        res.send(mapper.responseMapping(usrConst.CODE.INTRNLSRVR, usrConst.MESSAGE.internalServerError))
    })
})

router.route('/updatePayoutBalance').post((req, res) => {



    facade.updatePayoutBalance(req.body).then((result) => {

        res.send(result)
    }).catch((err) => {

        console.log({ err })
        res.send(mapper.responseMapping(usrConst.CODE.INTRNLSRVR, usrConst.MESSAGE.internalServerError))
    })
})

router.route('/resetMerchantPassword').post((req, res) => {



    facade.resetMerchantPassword(req.body).then((result) => {

        res.send(result)
    }).catch((err) => {

        console.log({ err })
        res.send(mapper.responseMapping(usrConst.CODE.INTRNLSRVR, usrConst.MESSAGE.internalServerError))
    })
})



router.route('/addSales').post(async (req, res) => {
    try {
        let validate = await validateRequest({ emailId: req.body.emailId, apiKey: req.body.apiKey })
        if (validate == false) {
            return res.send({
                responseCode: 401,
                responseMessage: "Unauthorized"
            });
        }
        await facade.addSales(req, res)
    } catch (err) {
        return res.send({
            responseCode: 500,
            responseMessage: "Your request couldn't be processed,please try again!"
        });
    }

})


router.route('/addIp').post(async (req, res) => {
    try {
        let validate = await validateRequest({ emailId: req.body.emailId, apiKey: req.body.apiKey })
        if (validate!==true) {
            return res.send({
                responseCode: 401,
                responseMessage: "Unauthorized"
            });
        }
        await facade.addIp(req, res)
    } catch (err) {
        return res.send({
            responseCode: 500,
            responseMessage: "Your request couldn't be processed,please try again!"
        });
    }

})

router.route('/allMerchants').post(async (req, res) => {
    try {
        let validate = await validateRequest({ emailId: req.body.emailId, apiKey: req.body.apiKey })
        if (validate == false) {
            return res.send({
                responseCode: 401,
                responseMessage: "Unauthorized"
            });
        }
        await facade.allMerchants(req, res)
    } catch (err) {
        return res.send({
            responseCode: 500,
            responseMessage: "Your request couldn't be processed,please try again!"
        });
    }
})

router.route('/allSales').post(async (req, res) => {
    try {
        let validate = await validateRequest({ emailId: req.body.emailId, apiKey: req.body.apiKey })
        if (validate == false) {
            return res.send({
                responseCode: 401,
                responseMessage: "Unauthorized"
            });
        }
        await facade.allSales(req, res)
    } catch (err) {
        return res.send({
            responseCode: 500,
            responseMessage: "Your request couldn't be processed,please try again!"
        });
    }

})

router.route('/editSales').post(async (req, res) => {
    try {
        let validate = await validateRequest({ emailId: req.body.emailId, apiKey: req.body.apiKey })
        if (validate == false) {
            return res.send({
                responseCode: 401,
                responseMessage: "Unauthorized"
            });
        }
        await facade.editSales(req, res)
    } catch (err) {
        return res.send({
            responseCode: 500,
            responseMessage: "Your request couldn't be processed,please try again!"
        });
    }

})

router.route('/deleteSales').post(async (req, res) => {
    try {
        let validate = await validateRequest({ emailId: req.body.emailId, apiKey: req.body.apiKey })
        if (validate == false) {
            return res.send({
                responseCode: 401,
                responseMessage: "Unauthorized"
            });
        }
        await facade.deleteSales(req, res)
    } catch (err) {
        return res.send({
            responseCode: 500,
            responseMessage: "Your request couldn't be processed,please try again!"
        });
    }

})

// TOP UP SECTION STARTS
router.route('/addTopup').post(async (req, res) => {
    try {
        let validate = await validateRequest({ emailId: req.body.emailId, apiKey: req.body.apiKey })
        if (validate == false) {
            return res.send({
                responseCode: 401,
                responseMessage: "Unauthorized"
            });
        }
        await facade.addTopup(req, res)
    } catch (err) {
        return res.send({
            responseCode: 500,
            responseMessage: "Your request couldn't be processed,please try again!"
        });
    }

})

// router.route('/getusertopups').post(async (req, res) => {
//     try {
//         console.log("request coming here")
//         let validate = await validateRequest({ emailId: req.body.emailId, apiKey: req.body.apiKey })
//         if (validate == false) {
//             return res.send({
//                 responseCode: 401,
//                 responseMessage: "Unauthorized"
//             });
//         }
//         await facade.getUsersTopup(req, res)
//     } catch (err) {
//         return res.send({
//             responseCode: 500,
//             responseMessage: "Your request couldn't be processed,please try again!"
//         });
//     }

// })

router.route('/getusertopups').post((req, res) => {



    facade.getUsersTopup(req.body).then((result) => {
        console.log(result);
        res.send(result)
    }).catch((err) => {

        console.log({ err })
        res.send(mapper.responseMapping(usrConst.CODE.INTRNLSRVR, usrConst.MESSAGE.internalServerError))
    })
})

router.route('/setDailyLimit').post((req, res) => {



    facade.setDailyLimit(req.body).then((result) => {
        console.log(result);
        res.send(result)
    }).catch((err) => {

        console.log({ err })
        res.send(mapper.responseMapping(usrConst.CODE.INTRNLSRVR, usrConst.MESSAGE.internalServerError))
    })
})

router.route('/downloadCsvByDate').post((req, res) => {



    facade.downloadCsvByDate(req.body).then((result) => {
        console.log(result);
        res.send(result)
    }).catch((err) => {

        console.log({ err })
        res.send(mapper.responseMapping(usrConst.CODE.INTRNLSRVR, usrConst.MESSAGE.internalServerError))
    })
})

router.route('/downloadCsvByDateAndStatus').post((req, res) => {



    facade.downloadCsvByDateAndStatus(req.body).then((result) => {
        console.log(result);
        res.send(result)
    }).catch((err) => {

        console.log({ err })
        res.send(mapper.responseMapping(usrConst.CODE.INTRNLSRVR, usrConst.MESSAGE.internalServerError))
    })
})

router.route('/downloadMerchantCsvByDate').post((req, res) => {



    facade.downloadMerchantCsvByDate(req.body).then((result) => {
        console.log(result);
        res.send(result)
    }).catch((err) => {

        console.log({ err })
        res.send(mapper.responseMapping(usrConst.CODE.INTRNLSRVR, usrConst.MESSAGE.internalServerError))
    })
})

router.route('/downloadMerchantCsvByDateAndStatus').post((req, res) => {



    facade.downloadMerchantCsvByDateAndStatus(req.body).then((result) => {
        console.log(result);
        res.send(result)
    }).catch((err) => {

        console.log({ err })
        res.send(mapper.responseMapping(usrConst.CODE.INTRNLSRVR, usrConst.MESSAGE.internalServerError))
    })
})

router.route('/downloadCsvForAll').post((req, res) => {



    facade.downloadCsvForAll(req.body).then((result) => {
        console.log(result);
        res.send(result)
    }).catch((err) => {

        console.log({ err })
        res.send(mapper.responseMapping(usrConst.CODE.INTRNLSRVR, usrConst.MESSAGE.internalServerError))
    })
})

router.route('/downloadCsvForMerchant').post((req, res) => {



    facade.downloadCsvForMerchant(req.body).then((result) => {
        console.log(result);
        res.send(result)
    }).catch((err) => {

        console.log({ err })
        res.send(mapper.responseMapping(usrConst.CODE.INTRNLSRVR, usrConst.MESSAGE.internalServerError))
    })
})

router.route('/downloadCsvForMerchantByStatus').post((req, res) => {



    facade.downloadCsvForMerchantByStatus(req.body).then((result) => {
        console.log(result);
        res.send(result)
    }).catch((err) => {

        console.log({ err })
        res.send(mapper.responseMapping(usrConst.CODE.INTRNLSRVR, usrConst.MESSAGE.internalServerError))
    })
})

router.route('/downloadCsvByStatus').post((req, res) => {



    facade.downloadCsvByStatus(req.body).then((result) => {
        console.log(result);
        res.send(result)
    }).catch((err) => {

        console.log({ err })
        res.send(mapper.responseMapping(usrConst.CODE.INTRNLSRVR, usrConst.MESSAGE.internalServerError))
    })
})



router.route('/downloadSettlementCsvByDate').post((req, res) => {
    facade.downloadSettlementCsvByDate(req.body).then((result) => {
        console.log(result);
        res.send(result)
    }).catch((err) => {

        console.log({ err })
        res.send(mapper.responseMapping(usrConst.CODE.INTRNLSRVR, usrConst.MESSAGE.internalServerError))
    })
})



router.route('/downloadGatewaySettlementCsvByDate').post((req, res) => {
    facade.downloadGatewaySettlementCsvByDate(req.body).then((result) => {
        console.log(result);
        res.send(result)
    }).catch((err) => {

        console.log({ err })
        res.send(mapper.responseMapping(usrConst.CODE.INTRNLSRVR, usrConst.MESSAGE.internalServerError))
    })
})



//payouts
router.route('/activatePayout').post((req, res) => {



    facade.activatePayout(req.body).then((result) => {
        console.log(result);
        res.send(result)
    }).catch((err) => {

        console.log({ err })
        res.send(mapper.responseMapping(usrConst.CODE.INTRNLSRVR, usrConst.MESSAGE.internalServerError))
    })
})


router.route('/settlementConstants').get(async (req, res) => {
try{
    const data = ["settlement","refund","chargeback","rolling_reserve","misc"]
    return res.send(
        {
            responseCode: 200,
            responseMessage: "Success",
            responseData: data
        }
    )

}catch(error){
    return res.send(mapper.responseMapping(usrConst.CODE.INTRNLSRVR, usrConst.MESSAGE.internalServerError))
}   
})


router.route('/newSettleMoney').post(async (req, res) => {
    try{
        const data = await facade.newSettleMoney(req)
        return res.send(data)
    }catch(error){
        return res.send(mapper.responseMapping(usrConst.CODE.INTRNLSRVR, usrConst.MESSAGE.internalServerError))
    }  

})


router.route('/getMerchantSettlementByType').post(async (req, res) => {
    try{
        const data = await facade.getMerchantSettlementByType(req)
        return res.send(data)
    }catch(error){
        return res.send(mapper.responseMapping(usrConst.CODE.INTRNLSRVR, usrConst.MESSAGE.internalServerError))
    }  

})





module.exports = router
