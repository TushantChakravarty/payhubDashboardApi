const service = require('./salesService')

async function Login(req, res) {
  try {
    return service.Login(req, res)
  } catch (err) {
    res.send({
      responseCode: 500,
      responseCode: "Your request couldn't be processed please try again!"
    })

  }
}

async function getVolumes(req, res) {
  try {
    return service.Login(req, res)
  } catch (err) {
    res.send({
      responseCode: 500,
      responseCode: "Your request couldn't be processed please try again!"
    })
  }

}

async function GetMerchants(req, res) {
  try {
    return service.GetMerchants(req, res)
  } catch (err) {
    res.send({
      responseCode: 500,
      responseCode: "Your request couldn't be processed please try again!"
    })
  }
}


async function merchantVolume(req, res) {
  try {
    return service.merchantVolume(req, res)
  } catch (err) {
    res.send({
      responseCode: 500,
      responseCode: "Your request couldn't be processed please try again!"
    })
  }
}



async function resetPassword(req, res) {
  try {
    return service.resetPassword(req, res)
  } catch (err) {
    res.send({
      responseCode: 500,
      responseCode: "Your request couldn't be processed please try again!"
    })
  }
}

async function getProfile(req, res) {
  try {
    return service.getProfile(req, res)
  } catch (err) {
    res.send({
      responseCode: 500,
      responseCode: "Your request couldn't be processed please try again!"
    })
  }
}



module.exports = {
  Login,
  getVolumes,
  GetMerchants,
  merchantVolume,
  resetPassword,
  getProfile
}