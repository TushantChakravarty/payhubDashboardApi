const router = require("express").Router();
const service = require('./payoutsServices');
const usrConst = require('../utils/userConstants');
const mapper = require('../utils/userMapper');
const validators = require('../utils/userValidators');

const {validateData} = require('./payoutsValidator')



router.route('/getPayoutsBalance').post( (req, res) => {

    let details = req.body
    //console.log(req.body)
    service.getPayoutBalance(details).then((result) => {

        res.send(result)
    }).catch((err) => {

        console.log({ err })
        res.send(mapper.responseMapping(usrConst.CODE.INTRNLSRVR, usrConst.MESSAGE.internalServerError))
    })
})

router.route('/getPayoutsData').post( (req, res) => {

    let details = req.body
    //console.log(req.body)
    service.getPayoutData(details).then((result) => {

        res.send(result)
    }).catch((err) => {

        console.log({ err })
        res.send(mapper.responseMapping(usrConst.CODE.INTRNLSRVR, usrConst.MESSAGE.internalServerError))
    })
})


router.route('/sendPayoutRequest').post([validateData,validators.checkToken], (req, res) => {
    let apiKey = req.headers['apikey'];

   
    let details = req.body
    details.apiKey = apiKey
    //let details = req.body
    console.log(details)
    service.sendPaymentRequest(details).then((result) => {

        res.send(result)
    }).catch((err) => {

        console.log({ err })
        res.send(mapper.responseMapping(usrConst.CODE.INTRNLSRVR, usrConst.MESSAGE.internalServerError))
    })
})

router.route('/getAllPayoutTransactions').post( (req, res) => {
    //let apiKey = req.headers['apikey']
   
    let details = req.body
    //details.apiKey = apiKey
    //let details = req.body
    console.log(details)
    service.getAllPayoutTransactions(details).then((result) => {

        res.send(result)
    }).catch((err) => {

        console.log({ err })
        res.send(mapper.responseMapping(usrConst.CODE.INTRNLSRVR, usrConst.MESSAGE.internalServerError))
    })
})

router.route('/getPayoutDataMerchant').post( (req, res) => {
    //let apiKey = req.headers['apikey']
   
    let details = req.body
    //details.apiKey = apiKey
    //let details = req.body
    console.log(details)
    service.getPayoutDataMerchant(details).then((result) => {

        res.send(result)
    }).catch((err) => {

        console.log({ err })
        res.send(mapper.responseMapping(usrConst.CODE.INTRNLSRVR, usrConst.MESSAGE.internalServerError))
    })
})

router.route('/getPayoutDataById').post( (req, res) => {
    //let apiKey = req.headers['apikey']
   
    let details = req.body
    //details.apiKey = apiKey
    //let details = req.body
    //console.log(details)
    service.getPayoutDataById(details).then((result) => {

        res.send(result)
    }).catch((err) => {

        console.log({ err })
        res.send(mapper.responseMapping(usrConst.CODE.INTRNLSRVR, usrConst.MESSAGE.internalServerError))
    })
})

router.route('/getAllPayouts').post( (req, res) => {
    //let apiKey = req.headers['apikey']
   
    let details = req.body
    //details.apiKey = apiKey
    //let details = req.body
    //console.log(details)
    service.getAllPayoutsData(details).then((result) => {

        res.send(result)
    }).catch((err) => {

        console.log({ err })
        res.send(mapper.responseMapping(usrConst.CODE.INTRNLSRVR, usrConst.MESSAGE.internalServerError))
    })
})

router.route('/getAllPayoutsDataMerchants').post( (req, res) => {
    //let apiKey = req.headers['apikey']
   
    let details = req.body
    //details.apiKey = apiKey
    //let details = req.body
    //console.log(details)
    service.getAllPayoutsDataMerchant(details).then((result) => {

        res.send(result)
    }).catch((err) => {

        console.log({ err })
        res.send(mapper.responseMapping(usrConst.CODE.INTRNLSRVR, usrConst.MESSAGE.internalServerError))
    })
})

router.route('/getAllPayoutsMerchants').post( (req, res) => {
    //let apiKey = req.headers['apikey']
   
    let details = req.body
    //details.apiKey = apiKey
    //let details = req.body
    //console.log(details)
    service.getAllPayoutTransactionsMerchant(details).then((result) => {

        res.send(result)
    }).catch((err) => {

        console.log({ err })
        res.send(mapper.responseMapping(usrConst.CODE.INTRNLSRVR, usrConst.MESSAGE.internalServerError))
    })
})

router.route('/getMerchantPayoutLogs').post( (req, res) => {
    //let apiKey = req.headers['apikey']
   
    let details = req.body
    //details.apiKey = apiKey
    //let details = req.body
    //console.log(details)
    service.getMerchantPayoutLogs(details).then((result) => {

        res.send(result)
    }).catch((err) => {

        console.log({ err })
        res.send(mapper.responseMapping(usrConst.CODE.INTRNLSRVR, usrConst.MESSAGE.internalServerError))
    })
})

router.route('/getPayoutStatus').post( (req, res) => {
    let apiKey = req.headers['apikey']
   
    let details = req.body
    details.apiKey = apiKey
    console.log(details)
    service.fetchPayoutStatus(details).then((result) => {

        res.send(result)
    }).catch((err) => {

        console.log({ err })
        res.send(mapper.responseMapping(usrConst.CODE.INTRNLSRVR, usrConst.MESSAGE.internalServerError))
    })
})


module.exports = router
