// load all dependencies
var Promise = require('bluebird');
var jwt = Promise.promisifyAll(require('jsonwebtoken'));
var appConstants = require('./constants');
const { responseMapping } = require('./routesAndServices/utils/userMapper');
const { MESSAGE } = require('./routesAndServices/utils/userConstants');
const Sales = require("./generic/models/salesModel")
//var TOKEN_EXPIRATION_SEC = appConstants.TOKEN_EXPIRATION_TIME * 60;



const TOKEN_EXPIRATION_SEC = 365 * 24 * 60 * 60; // 1 year in seconds

const genUsrToken = async function (user) {
  var options = { expiresIn: TOKEN_EXPIRATION_SEC };
  try {
    const filteredUser = {
           // Include only necessary fields
      email: user.emailId,
     // Include other non-sensitive fields as needed
      // Add any other non-sensitive fields required in the token
    };
    const jwtToken = await jwt.signAsync(filteredUser, process.env.JWTSECRET, options);
    return jwtToken;
  } catch (err) {
    console.error(err);
    throw err; // Re-throw the error to handle it at a higher level if needed
  }
};

async function generatePageExpiryToken(emailId, apiKey) {
  const secretKey = process.env.PAGEEXPIRY;

  // User information or any data you want to include in the token payload
  const payload = {
    emailId,
    apiKey,
  };

  // Set the expiration time to 1 minute (60 seconds)
  const expiresIn = '15m';

  // Create the token
  const token = jwt.sign(payload, secretKey, { expiresIn });

  //console.log('Generated Token:', token);
  return token
}

function verifyPageToken(token) {
  if (!token || token == undefined) {
    console.log('no token or corrupt token')
    return responseMapping(appConstants.CODE.FRBDN, MESSAGE.InvalidCredentials)
  }

  return new Promise((resolve, reject) => {
    jwt.verify(token, process.env.PAGEEXPIRY, (err, decoded) => {
      if (err) {
        // Token verification failed
        console.log('invalid')
        reject(err);
        return responseMapping(appConstants.CODE.FRBDN, MESSAGE.InvalidCredentials)
      } else {
        // Token is valid
        console.log('valid page token')
        resolve(decoded);
        return responseMapping(appConstants.CODE.Success, MESSAGE.Success)
      }
    });
  });
}


const authenticateJWT = (req, res, next) => {
  const secret = process.env.JWTSECRET
  const token = req.header('Authorization') || req.header('authorization') || req.header.authorization || req.headers.authorization || null

  if (!token) {
    return res.send({
      responseCode: 403,
      responseMessage: 'Unauthorized'
    });
  }

  jwt.verify(token, secret, async (err, decodedToken) => {
    if (err) {
      return res.send({
        responseCode: 403,
        responseMessage: 'Unauthorized'
      });
    }

    // Attach the user ID to the request object for use in controllers
    const salesId = decodedToken._id;

    try {
      const sales = await Sales.findOne({ _id: salesId });
      if (!sales) {
        return res.send({
          responseCode: 403,
          responseMessage: 'Unauthorized '
        });
      }

      req.sales = sales;

      sales.lastActive = new Date();
      await sales.save();

      // Call next() inside the callback after all asynchronous operations are complete
      next();
    } catch (error) {
      // Handle any database or other errors
      console.error('Error:', error);
      return res.send({
        responseCode: 500,
        responseMessage: 'Internal Server Error'
      });
    }
  });
};





module.exports = {
  genUsrToken,

  generatePageExpiryToken,

  verifyPageToken,

  authenticateJWT
};
