const router = require("express").Router();
const facade = require('./supportFacade');
const usrConst = require('../utils/userConstants');
const mapper = require('../utils/userMapper');


router.route('/getAllMerchants').post( (req, res) => {
    let apiKey = req.headers['apikey']
   
    let details = req.body
    details.apiKey = apiKey
    facade.getAllMerchants(details).then((result) => {

        res.send(result)
    }).catch((err) => {

        console.log({ err })
        res.send(mapper.responseMapping(usrConst.CODE.INTRNLSRVR, usrConst.MESSAGE.internalServerError))
    })
})
router.route('/addAgent').post( (req, res) => {
    let apiKey = req.headers['apikey']
   
    let details = req.body
    details.apiKey = apiKey
    facade.addAgent(details).then((result) => {

        res.send(result)
    }).catch((err) => {

        console.log({ err })
        res.send(mapper.responseMapping(usrConst.CODE.INTRNLSRVR, usrConst.MESSAGE.internalServerError))
    })
})


router.route('/verifyAgent').post( (req, res) => {
    let apiKey = req.headers['apikey']
   
    let details = req.body
    details.apiKey = apiKey
    facade.verifyAgent(details).then((result) => {

        res.send(result)
    }).catch((err) => {

        console.log({ err })
        res.send(mapper.responseMapping(usrConst.CODE.INTRNLSRVR, usrConst.MESSAGE.internalServerError))
    })
})

router.route('/getTransactionGateway').post( (req, res) => {
    let apiKey = req.headers['apikey']
   
    let details = req.body
    details.apiKey = apiKey
    facade.getTransactionGatewayData(details).then((result) => {

        res.send(result)
    }).catch((err) => {

        console.log({ err })
        res.send(mapper.responseMapping(usrConst.CODE.INTRNLSRVR, usrConst.MESSAGE.internalServerError))
    })
})

router.route('/resolveQuery').post( (req, res) => {
    let apiKey = req.headers['apikey']
   
    let details = req.body
    details.apiKey = apiKey
    facade.resolveQuery(details).then((result) => {

        res.send(result)
    }).catch((err) => {

        console.log({ err })
        res.send(mapper.responseMapping(usrConst.CODE.INTRNLSRVR, usrConst.MESSAGE.internalServerError))
    })
})


module.exports = router
