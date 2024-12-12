'use strict';



var promise = require('bluebird');
var bcrypt = require('bcryptjs');
var jwt = require('jsonwebtoken')
const fetch = require('cross-fetch');
const CryptoJS = require('crypto-js');
const { getTransactionsByStatusAndGateway, getTransactionsByStatusAndGatewayNoLimit } = require('./routesAndServices/transactionsDao/TransactionDao');
const crypto = require("crypto")
const { parseString } = require('xml2js');
const Fetch = require('node-fetch');
const BlockedVPA = require('./generic/models/blockedVpa')
const xlsx = require('xlsx');
const path = require('path');
const IpWhitelist = require("./generic/models/IpWhitelistingModel")
const IP = require('ip');

const Admin = require("./generic/models/adminModel")

async function getPublicIpv6() {
  const { publicIpv6, publicIpv4, publicIp } = await import('public-ip');
  return publicIpv4();
}

async function getAllPendinTransactions(status, gateway) {
  //console.log('hit')
  const transactions = await getTransactionsByStatusAndGateway(status, gateway)
  //console.log(transactions)
  return transactions
}

async function getAllPendinTransactionsNoLimit(status, gateway) {
  //console.log('hit')
  const transactions = await getTransactionsByStatusAndGatewayNoLimit(status, gateway)
  //console.log(transactions)
  return transactions
}


/**
 * returns if email is valid or not
 * @returns {boolean}
 */
function isValidEmail(email) {
  var pattern = /(([a-zA-Z0-9\-?\.?]+)@(([a-zA-Z0-9\-_]+\.)+)([a-z]{2,3}))+$/;
  return new RegExp(pattern).test(email);
}



async function convertPass(password) {
  let pass = await bcrypt.hash(password, 10)
  // req.body.password = pass;
  return pass
}

function verifyPassword(user, isExist) {
  return bcrypt.compare(user.password, isExist.password);
}


function createToken(user) {

  console.log(process.env.TOKEN_KEY)
  const token = jwt.sign(
    { user_id: user._id, email: user.email },
    process.env.TOKEN_KEY,
    {
      expiresIn: "1h",
    }
  );

  return token;
}
function encryptText(input) {
  var ciphertext = CryptoJS.AES.encrypt(input, process.env.SECRETKEY).toString();
  console.log(ciphertext)
  return ciphertext

}
function decryptText(input) {
  console.log(input,process.env.SECRETKEY)
  var bytes = CryptoJS.AES.decrypt(input, process.env.SECRETKEY);
  var originalText = bytes.toString(CryptoJS.enc.Utf8);
  console.log(originalText)
  return originalText

}
function encryptParameters(input, secretKey) {
  var ciphertext = CryptoJS.AES.encrypt(input, secretKey).toString();
  console.log(ciphertext)
  return ciphertext

}

function decryptParameters(input, secretKey) {
  const decryptedBytes = CryptoJS.AES.decrypt(input, secretKey);
  const decryptedData = decryptedBytes.toString(CryptoJS.enc.Utf8);
  return decryptedData;

}


function generatePassword(len, arr) {
  let ans = '';
  for (let i = len; i > 0; i--) {
    ans +=
      arr[(Math.floor(Math.random() * arr.length))];
  }
  console.log(ans);
  return ans
}

async function getCryptoData() {
  let response

  try {
    response = await fetch("https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=10&page=1&sparkline=false"
      , {
        method: "GET",
        headers: {

          'Content-Type': 'application/json',
        },
      })
      .then((response) => response.json())
      .then((resp) => {

        //console.log(resp)


        return { resp }

      })
      .catch((error) => {
        console.error(error);
      })
  } catch (error) {
    console.log(error)
  }
  return response

}

async function airpaytest() {
  const merchant_id = process.env.AIRPAYMERCID;
  const merchant_txn_id = "486183006";
  const date_f = "2024-03-15";
  const username = process.env.AIRPAYUSERNAME;
  const password = process.env.AIRPAYPASSWORD;
  const secret = process.env.AIRPAYSECRET;

  // Generate key
  const key = crypto.createHash('sha256').update(`${username}~:~${password}`).digest('hex');

  const alldata = `${merchant_id}${merchant_txn_id}${date_f}`;

  // Calculate the checksum using SHA-256
  const checksumData = `${key}@${alldata}`;

  const checksum = crypto.createHash('sha256').update(checksumData).digest('hex');

  // Payment Gateway URL
  const paymentGatewayURL = "https://kraken.airpay.co.in/airpay/order/verify.php";
  const private_key = crypto.createHash('sha256').update(`${secret}@${username}:|:${password}`).digest('hex');

  // Prepare the POST data
  const postData = new URLSearchParams();
  postData.append('merchant_id', merchant_id);
  postData.append('merchant_txn_id', merchant_txn_id);
  postData.append('private_key', private_key);
  postData.append('checksum', checksum);
  
  // Perform the POST request
  try {
      const response = await fetch(paymentGatewayURL, {
          method: 'POST',
          headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: postData,
      });

      if (!response.ok) {
          throw new Error('Network response was not ok');
      }

      const xmlData = await response.text();

      // Convert XML to JSON
      parseString(xmlData, (err, result) => {
          if (err) {
              console.error('Error parsing XML:', err);
          } else {
              // Result is the JSON representation
              console.log('JSON Response:', result.RESPONSE.TRANSACTION);
              // res.send(result)
          }
      });
  } catch (error) {
      console.error('Error:', error);
  }
}


function generateTransactionId(length) {
  //console.log('ran')
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let transactionId = '';
  for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * characters.length);
      transactionId += characters.charAt(randomIndex);
  }
 // console.log(transactionId)
  return transactionId;
}


async function createVpaData()
{
  // Load VPAs from the Excel file
  const filePath = path.join(__dirname, 'blocked.xlsx');
  const workbook = xlsx.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const vpas = xlsx.utils.sheet_to_json(worksheet);

  const vpaList = vpas.map(row => ({ vpa: row['Customer VPA list'] }));
  console.log(vpaList)
  // await BlockedVPA.insertMany(vpaList, { ordered: false });
  // console.log('VPAs inserted successfully');
}

function validateUPIId(upiId) {
  // Regular expression for validating UPI ID
  const upiPattern = /^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/;
  return upiPattern.test(upiId);
}

function generateUpiUrl(baseUrl, upiUrl) {
  const params = new URLSearchParams(new URL(upiUrl).search);
  const urlObj = new URL(baseUrl);
  urlObj.searchParams.set("pa", params.get("pa"));
  urlObj.searchParams.set("pn", params.get("pn"));
  urlObj.searchParams.set("tn", params.get("tn"));
  urlObj.searchParams.set("tr", params.get("tr"));
  urlObj.searchParams.set("am", params.get("am"));
  urlObj.searchParams.set("cu", params.get("cu"));
  return urlObj.href;
}

// Generate PhonePe URL
function generatePhonePeURL(upiUrl) {
  const params = new URLSearchParams(upiUrl.split("?")[1]);
  return `phonepe://pay?pa=${encodeURIComponent(params.get("pa"))}&pn=${encodeURIComponent(params.get("pn"))}&tr=${encodeURIComponent(params.get("tr"))}&cu=${encodeURIComponent(params.get("cu"))}&mc=${encodeURIComponent(params.get("mc"))}&tn=${encodeURIComponent(params.get("tn"))}&am=${encodeURIComponent(params.get("am"))}`;
}



function rbamMiddleware(req, res, next) {
  try {
     // const accessRoles = req.accessRoles || [];
      const accessFields = req.accessFields || [];
      
      // Check if the user has the necessary role to access the route
      // if (accessRoles.length > 0 && !accessRoles.includes(req.user?.role)) {
      //     return res.status(403).json({ error: "Forbidden" });
      // }

      // If user is admin, check if at least one of the accessFields is present in the user's access object and is true.
      if (accessFields.length > 0 && !accessFields.some((field) => req.user?.access?.[field] === true)) {
          return res.status(403).json({ error: "Forbidden" });
      }

      // If all checks pass, proceed to the next middleware
      next();   
  } catch (err) {
      console.error(`RBAM Error: ${err.message}`);
      return res.status(401).json({ error: "Unauthorized" });
  }
}


async function attachUserMiddleware(req, res, next) {
  try {
      const { emailId } = req.body;

      if (!emailId) {
          return res.status(400).json({ error: "Email ID is required" });
      }

      // Find user by email
      const user = await Admin.findOne({ emailId: emailId });
      
      if (!user) {
          return res.status(404).json({ error: "Admin not found" });
      }

      // Attach the user to req.user
      req.user = user;
      next();
  } catch (err) {
      console.error(`Error attaching user: ${err.message}`);
      return res.status(500).json({ error: "Internal Server Error" });
  }
}


async function checkIpWhitelist(req, res, next) {
  try {
    // Extract the IP address from the request headers
    const ip = await getPublicIpv6()//IP.address(); //req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    console.log(ip)
    // Check if the IP is in the whitelist
    const ipExists = await IpWhitelist.findOne({ ip: ip });

    if (!ipExists) {
      return res.status(403).send({
        responseCode: 403,
        responseMessage: "Access denied. IP not allowed.",
      });
    }

    // If IP is allowed, proceed to the next middleware or route handler
    next();
  } catch (error) {
    res.status(500).send({
      responseCode: 500,
      responseMessage: "An error occurred while checking the IP whitelist",
      error,
    });
  }
}

// gatewayRead,
// gatewayWrite,
// payinRead,
// payinWrite,
// payoutRead,
// payoutWrite,
// merchantRead,
// merchantWrite,
// settlementRead,
// settlementWrite,
// adminRead,
// adminWrite,
// supportRead,
// supportWrite,
// salesRead,
// saledWrite



module.exports = {

  rbamMiddleware,

  verifyPassword,

  isValidEmail,

  convertPass,

  createToken,

  encryptText,

  decryptText,

  getCryptoData,

  generatePassword,

  encryptParameters,

  decryptParameters,

  getAllPendinTransactions,

  airpaytest,

  generateTransactionId,

  createVpaData,

  validateUPIId,

  generateUpiUrl,

  generatePhonePeURL,

  attachUserMiddleware,

  checkIpWhitelist,

  getAllPendinTransactionsNoLimit

};

