const router = require("express").Router();
const facade = require('./salesFacade')
const jwtHandler = require("../../jwtHandler")


router.route('/login').post(async (req, res) => {
  try {
    await facade.Login(req, res)
  } catch (err) {
    res.send({
      responseCode: 500,
      responseCode: "Your request couldn't be processed please try again!"
    })
  }
})

router.route('/getVolumes').get(async (req, res) => {
  try {
    await facade.getVolumes(req, res)
  } catch (err) {
    res.send({
      responseCode: 500,
      responseCode: "Your request couldn't be processed please try again!"
    })
  }
})

router.route('/getMerchants').post(jwtHandler.authenticateJWT, async (req, res) => {
  try {
    await facade.GetMerchants(req, res)
  } catch (err) {
    res.send({
      responseCode: 500,
      responseCode: "Your request couldn't be processed please try again!"
    })
  }
})


router.route('/merchantVolume').post(jwtHandler.authenticateJWT, async (req, res) => {
  try {
    await facade.merchantVolume(req, res)
  } catch (err) {
    res.send({
      responseCode: 500,
      responseCode: "Your request couldn't be processed please try again!"
    })
  }
})

router.route('/resetPassword').post(jwtHandler.authenticateJWT, async (req, res) => {
  try {
    await facade.resetPassword(req, res)
  } catch (err) {
    res.send({
      responseCode: 500,
      responseCode: "Your request couldn't be processed please try again!"
    })
  }
})

router.route('/getProfile').post(jwtHandler.authenticateJWT, async (req, res) => {
  try {
    await facade.getProfile(req, res)
  } catch (err) {
    res.send({
      responseCode: 500,
      responseCode: "Your request couldn't be processed please try again!"
    })
  }
})







module.exports = router
