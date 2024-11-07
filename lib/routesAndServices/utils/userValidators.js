
/*#################################            Load modules start            ########################################### */

const usrConst = require('./userConstants')
const jwtHandler = require('../../jwtHandler')
const ObjectId = require('mongoose').Types.ObjectId
const mapper = require('./userMapper')
const appUtils = require('../../appUtils')
const auth = require('../../middleware/auth')
const IP = require('ip');
const RequestModel = require('../../generic/models/IPModel')
const FlaggedIPModel = require('../../generic/models/flaggedIps')
const { sendMessage2 } = require('./userEmail')
const BlockedVPA = require("../../generic/models/blockedVpa")
/*#################################            Load modules end            ########################################### */

/**
 * Validate JWT token
 */
function checkToken(req, res, next) {

    let {token} = req.headers
    
    //console.log(token)
    if (!token ) {

        res.send(mapper.responseMapping(usrConst.CODE.FRBDN, usrConst.MESSAGE.TOKEN_NOT_PROVIDED))

        // return new exceptions.unauthorizeAccess(busConst.MESSAGE.TOKEN_NOT_PROVIDED)
    } else {

        const result = auth.verifyToken(token)
       // console.log(result)
            if (result?.decoded!=undefined) {
                req.tokenPayload = result;
                next()
            } else {

                res.send(mapper.responseMapping(usrConst.CODE.FRBDN, 'invalid token'))
            }
        
    }
}

function sanitizeInput(input) {
    if (typeof input === "string") {
      return input.replace(/[$.]/g, ""); // Remove special characters like $ and .
    }
    return input;
  }

/**
 * Validating register request
 */
function checkRegisterRequest(req, res, next) {

    let error = []
    let details = req.body

    if (!details || Object.keys(details).length == 0) {

        error.push({ responseCode: usrConst.CODE.BadRequest, responseMessage: usrConst.MESSAGE.InvalidDetails })
    } else {

        let { emailId,  password } = details

        if (!password && !emailId ) {

            error.push({ responseCode: usrConst.CODE.BadRequest, responseMessage: usrConst.MESSAGE.InvalidDetails })

        }

        // let { firstName, lastName, emailId, contactNumber, password} = details;
        // if (!firstName || !lastName || !password || (!emailId && !contactNumber)) {
        //     error.push({ responseCode: usrConst.CODE.BadRequest, responseMessage: usrConst.MESSAGE.InvalidDetails })
        // }

    }

    if (error.length > 0) {

        res.json(mapper.responseMapping(usrConst.CODE.BadRequest, usrConst.MESSAGE.InvalidDetails))
    } else {

        next()
    }
}





/**
 * Validating login request
 */
function checkLoginRequest(req, res, next) {

    let error = []
     let { emailId, password} = req.body

     if (!emailId && !password ) {

         error.push({ responseCode: usrConst.CODE.BadRequest, responseMessage: usrConst.MESSAGE.InvalidDetails })
     }


    if (error.length > 0) {

        res.json(mapper.responseMapping(usrConst.CODE.BadRequest, usrConst.MESSAGE.InvalidDetails))
    } else {

        next()
    }
}



/**
 * Validating forgot password request
 */
function checkForgotPasswordRequest(req, res, next) {

    let error = []
    let { emailId } = req.body

    if (!emailId || (!appUtils.isValidEmail(emailId))) {

        error.push({ responseCode: usrConst.CODE.BadRequest, responseMessage: usrConst.MESSAGE.InvalidDetails })
    }

    if (error.length > 0) {

        res.json(mapper.responseMapping(usrConst.CODE.BadRequest, usrConst.MESSAGE.InvalidDetails))
    } else {

        next()
    }

}

function checkPayinRequest(req, res, next) {

    let error = []
    let { emailId, customer_email, amount, phone, username  } = req.body

    if (!emailId || (!appUtils.isValidEmail(emailId)) || !customer_email || (!appUtils.isValidEmail(customer_email)) || !amount || !phone || !username ) {

        error.push({ responseCode: usrConst.CODE.BadRequest, responseMessage: usrConst.MESSAGE.InvalidDetails })
    }
    if (emailId ==""|| customer_email=="" || amount=="" || phone=="" || username=="" ) {

        error.push({ responseCode: usrConst.CODE.BadRequest, responseMessage: usrConst.MESSAGE.InvalidDetails })
    }

    if (emailId.toString().length==0|| customer_email.toString().length==0 || amount.toString().length==0 || phone.toString().length==0 || username.toString().length==0 ) {

        error.push({ responseCode: usrConst.CODE.BadRequest, responseMessage: usrConst.MESSAGE.InvalidDetails })
    }

    if (error.length > 0) {

        res.json(mapper.responseMapping(usrConst.CODE.BadRequest, usrConst.MESSAGE.InvalidDetails))
    } else {

        next()
    }

}



/**
 * Validating set new password by recovery link
 */
function checkSetNewPasswordRequest(req, res, next) {

    let error = []
    let { redisId } = req.params
    let { password } = req.body
    console.log(redisId)
    if (!redisId || !password) {

        error.push({ responseCode: usrConst.CODE.BadRequest, responseMessage: usrConst.MESSAGE.InvalidDetails })
    }
    if (error.length > 0) {

        res.json(mapper.responseMapping(usrConst.CODE.BadRequest, usrConst.MESSAGE.InvalidDetails))
    } else {

        next()
    }
}

const checkRequestIps = async (req, res, next) => {
    const { emailId, customer_email } = req.body;
    const ip = IP.address();
    console.log('ip',ip)
    try {
    const exists = await FlaggedIPModel.exists({ ip, email:customer_email });

    if (exists) {
        sendMessage2("info@werner.asia",ip,customer_email?customer_email:'')
      //return res.status(403).json({ error: 'Request with the same IP and email already exists' });
      next()
      return
    }

    const existingRequest = await RequestModel.findOne({ ip, email:customer_email });

    if (existingRequest) {
      // Update the count property if the combination already exists
      await RequestModel.findByIdAndUpdate(existingRequest._id, { $inc: { count: 1 } });
    } else {
      // Create a new document if the combination does not exist
      await RequestModel.create({ ip, email:customer_email, count: 1 });
    }
      // Save the request details in MongoDB
      //await RequestModel.create({ ip, email:emailId });
  
      // Check the count of requests with the same IP and email
      const data = await RequestModel.findOne({ ip,email:customer_email });

      //const count = await RequestModel.countDocuments({ ip, email:emailId });
  
      if (data?.count >= 5) {
        await FlaggedIPModel.findOneAndUpdate({ ip }, { ip ,email:customer_email}, { upsert: true });
        next()
        //return res.status(429).json({ error: 'Too many requests from the same IP and email' });
      } else {
        next();
      }
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  };

  async function blockVPAs(req, res, next) {
    const { upiId } = req.body;
  
    const pipeline = [
      { $match: { vpa: upiId } },
      { $limit: 1 }
    ];
    const validated = appUtils.validateUPIId(upiId)
    if(!validated)
    return res.status(400).json({ message: 'VPA is invalid' });
  
    const blockedVPA = await BlockedVPA.aggregate(pipeline).exec();
  
    if (blockedVPA.length > 0) {
      return res.status(403).json({ message: 'VPA is blocked' });
    }
  
    next();
  }
  



module.exports = {

    checkToken,

    checkRegisterRequest,

    checkLoginRequest,

    checkForgotPasswordRequest,

    checkSetNewPasswordRequest,

    checkPayinRequest,

    checkRequestIps,

    blockVPAs,

    sanitizeInput

}