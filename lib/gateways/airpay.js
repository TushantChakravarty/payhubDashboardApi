const crypto = require('crypto');
const axios = require('axios');
const fetch = require("node-fetch");
const sha256 = require('sha256')
const hash = require('hash.js');
const date = require('date-and-time');
const CryptoJS = require('crypto-js');
const aesjs = require('aes-js');
const xml2js = require('xml2js');
const Fetch = require('node-fetch');
const { updateGatewayDetailsNew } = require('../routesAndServices/gateway/gatewayDao');
const sendAirpayQrRequest = async (details) => {
  console.log('check', details)
  const response = await fetch("https://kraken.airpay.co.in/airpay/api/generateOrder.php", {
    method: 'POST',

    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,PUT,POST,DELETE,PATCH,OPTIONS',
      'AuthKey': 'edb7293b7a983d8b330a52a2ef139b8ee8054ac832db536491d197fee0184667',
    },
    body: JSON.stringify(
      {
        encData: details.encryptedData,
        checksum: details.checksum,
        mid: "294431"

      })
  })
    .then(resp => resp.json())
    .then(json => {
      if (json)
        return json
      return false
    })
    .catch((error) => {
      console.log(error)
    })
  return response

}
const check2 = async (referenceId,details)=>{
  const mercid = '294431';
const secretKey = "4z74sYwdqYUX6Pgv";
const username = "S8cyj8tS3m"
const password = "M3qt6RJk"
const secret = "4z74sYwdqYUX6Pgv"

const key256 = CryptoJS.SHA256(`${username}~:~${password}`).toString();
console.log('key256', key256);

const orderid = referenceId;
const amt = details.amount;
const buyerPhone = details.phone;
const buyerEmail = details.customer_email;
const mer_dom = Buffer.from('https://server.payhub.link').toString('base64');
const call_type = "upiqr";

// Concatenate the data as in PHP
const alldata = `${mercid}${orderid}${amt}${buyerPhone}${buyerEmail}${mer_dom}${call_type}`;

// Format the current date like PHP
const currentDate = date.format(new Date(), 'YYYY-MM-DD');

// Calculate the checksum using SHA-256
const checksumData = `${key256}@${alldata}${currentDate}`;
const checksum = crypto.createHash('sha256').update(checksumData).digest('hex');
console.log(checksum)

const data = {
mercid,
orderid,
amount: amt,
buyerPhone,
buyerEmail,
mer_dom,
call_type,
};

const encKey = crypto.createHash('md5').update(secret).digest('hex');
console.log(encKey)
const iv = crypto.randomBytes(8).toString('hex');
const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(encKey), iv);
let encData = cipher.update(JSON.stringify(data), 'utf8', 'base64');
encData += cipher.final('base64');
console.log(iv+encData)
const postData = JSON.stringify({
'encData': iv+encData,
'checksum': checksum,
'mercid': mercid,
});
const response = await axios
.post('https://kraken.airpay.co.in/airpay/api/generateOrder.php', postData, {
headers: {
'Content-Type': 'application/json',
},
})
.then((response) => {
//console.log(response)
const redData = response.data;
const encryptedData = redData.data;
console.log(encryptedData)
const iv = Buffer.from(encryptedData.slice(0, 16), 'binary');
const encrypted = Buffer.from(encryptedData.slice(16), 'base64');

const decipher = crypto.createDecipheriv('aes-256-cbc', encKey, iv);
let decrypted = decipher.update(encrypted, 'binary', 'utf8');
decrypted += decipher.final('utf8');
//console.log(decrypted);
return decrypted
})
.catch((error) => {
console.error(error);
});
return response
}

const airpayPayin = async (referenceId,details)=>{
const mercid = process.env.AIRPAYMERCID;
const username = process.env.AIRPAYUSERNAME
const password = process.env.AIRPAYPASSWORD
const secret = process.env.AIRPAYSECRET

const key256 = CryptoJS.SHA256(`${username}~:~${password}`).toString();
//console.log('key256', key256);

const orderid = referenceId;
const amt = details.amount;
const buyerPhone = details.phone;
const buyerEmail = details.customer_email;
const mer_dom = Buffer.from('https://server.payhub.link').toString('base64');
const call_type = "upiqr";
// const Data ={
//   mercid,
//   orderid,
//   amt,
//   buyerPhone,
//   buyerEmail,
//   mer_dom,
//   call_type
// }
// Concatenate the data as in PHP
const alldata = `${mercid}${orderid}${amt}${buyerPhone}${buyerEmail}${mer_dom}${call_type}`;
//console.log(Data)
// Format the current date like PHP
const currentDate = date.format(new Date(), 'YYYY-MM-DD');

// Calculate the checksum using SHA-256
const checksumData = `${key256}@${alldata}${currentDate}`;
const checksum = crypto.createHash('sha256').update(checksumData).digest('hex');
//console.log(checksum)

const data = {
mercid,
orderid,
amount: amt,
buyerPhone,
buyerEmail,
mer_dom,
call_type,
};

const encKey = crypto.createHash('md5').update(secret).digest('hex');
//console.log(encKey)
const iv = crypto.randomBytes(8).toString('hex');
const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(encKey), iv);
let encData = cipher.update(JSON.stringify(data), 'utf8', 'base64');
encData += cipher.final('base64');
//console.log(iv+encData)
const postData = JSON.stringify({
'encData': iv+encData,
'checksum': checksum,
'mercid': mercid,
});
const response = await axios
.post('https://kraken.airpay.co.in/airpay/api/generateOrder', postData, {
headers: {
'Content-Type': 'application/json',
},
})
.then((response) => {
//console.log(response)
const redData = response.data;
const encryptedData = redData.data;
//console.log(encryptedData)
const iv = Buffer.from(encryptedData.slice(0, 16), 'binary');
const encrypted = Buffer.from(encryptedData.slice(16), 'base64');

const decipher = crypto.createDecipheriv('aes-256-cbc', encKey, iv);
let decrypted = decipher.update(encrypted, 'binary', 'utf8');
decrypted += decipher.final('utf8');
//console.log(decrypted);
return decrypted
})
.catch((error) => {
console.error(error);
});
return response
}

const check = ()=>{
  

const mercid = '294431';
  const secretKey = "4z74sYwdqYUX6Pgv";
  const username = "DIGISLTS678760"
  const password = "TSAWRIL@8gh75kf"
  const secret = "4z74sYwdqYUX6Pgv"

  const key256 = CryptoJS.SHA256(username + "~:~" + password).toString(CryptoJS.enc.Hex);
  console.log(key256)
  const orderid = "230918184855912Bkkj";
const amt = "300.00";
const buyerPhone = "9340079982";
const buyerEmail = "tushant@gmail.com";
const mer_dom = Buffer.from('https://server.payhub.link/admin/savetxairpay').toString('base64');
const call_type = "upiqr";

// Concatenate the data as in PHP

// Concatenate the data as in PHP
const alldata = mercid + orderid + amt + buyerPhone + buyerEmail + mer_dom + call_type;

const currentDate = new Date().toISOString().split('T')[0];

const checksumData = key256 + '@' + alldata + currentDate;

const checksum = CryptoJS.SHA256(checksumData).toString(CryptoJS.enc.Hex);

console.log(checksum);
  
  const data = {
    mercid,
    orderid,
    amount: amt,
    buyerPhone,
    buyerEmail,
    mer_dom,
    call_type,
  };
  
  const json_data = JSON.stringify(data);

  const encKey = crypto.createHash('md5').update(secret).digest('hex').slice(0, 32); // Ensure the key length is 32 bytes

const iv = crypto.randomBytes(16);
const textBytes = aesjs.utils.utf8.toBytes(json_data);
const aesCtr = new aesjs.ModeOfOperation.ctr(aesjs.utils.hex.toBytes(encKey), new aesjs.Counter(5));
const encryptedBytes = aesCtr.encrypt(textBytes);
const encData = aesjs.utils.hex.fromBytes(iv) + aesjs.utils.hex.fromBytes(encryptedBytes);

  
console.log(encData);
  
  const postData = JSON.stringify({
    'encData': encData,
    'checksum': checksum,
    'mercid': mercid,
  });
    console.log(postData)
  axios
    .post('https://kraken.airpay.co.in/airpay/api/generateOrder.php', postData, {
      headers: {
        'Content-Type': 'application/json',
      },
    })
    .then((response) => {
      //console.log(response)
      const redData = response.data;
      const encryptedData = redData.data;
      console.log(encryptedData)
      const iv = Buffer.from(encryptedData.slice(0, 16), 'binary');
      const encrypted = Buffer.from(encryptedData.slice(16), 'base64');

    const decipher = crypto.createDecipheriv('aes-256-cbc', encKey, iv);
    let decrypted = decipher.update(encrypted, 'binary', 'utf8');
    decrypted += decipher.final('utf8');
    console.log(decrypted);
    })
    .catch((error) => {
      console.error(error);
    });
  //jj
}

function encryptAirpayRequest() {



// Execute the PHP code
  const mercid = '294431';
  const secretKey = "4z74sYwdqYUX6Pgv";
  const username = 'DIGISLTS678760'
  const password = "TSAWRIL@8gh75kf"
  const secret = '4z74sYwdqYUX6Pgv'
  const keySeed = crypto.createHash('md5').update(secret).digest('hex');

// Expand the 128-bit MD5 hash to a 256-bit key using a KDF
const encKey = crypto.pbkdf2Sync(keySeed, 'salt', 100000, 32, 'sha256'); // Derive a 256-bit key

const orderid = "230918184855912BuA4lwHk";
const amt = "300.00";
const buyerPhone = "9999999999";
const buyerEmail = "test@gmail.com";
const mer_dom = Buffer.from('http://localhost').toString('base64');
const call_type = "upiqr";

const alldata = mercid + orderid + amt + buyerPhone + buyerEmail + mer_dom + call_type;

const checksum = crypto.createHash('sha256').update(keySeed + '@' + alldata + (new Date()).toISOString().slice(0, 10)).digest('hex');

const fields = {
  mercid: mercid,
  orderid: orderid,
  amount: amt,
  buyerPhone: buyerPhone,
  buyerEmail: buyerEmail,
  mer_dom: mer_dom,
  call_type: call_type,
};

const json_data = JSON.stringify(fields);

const iv = crypto.randomBytes(16);
const cipher = crypto.createCipheriv('aes-256-cbc', encKey, iv);
let encData = cipher.update(json_data, 'utf8', 'base64');
encData += cipher.final('base64');

  const postData = { encData: encData, checksum, mercid: mercid, encKey };
 return postData
  // const options = {
  //   hostname: 'kraken.airpay.co.in',
  //   path: '/airpay/api/generateOrder.php',
  //   method: 'POST',
  //   headers: {
  //     'Content-Type': 'application/json',
  //     'Content-Length': Buffer.byteLength(postData)
  //   }
  // };

  // const req = https.request(options, (res) => {
  //   let data = '';

  //   res.on('data', (chunk) => {
  //     data += chunk;
  //   });

  //   res.on('end', () => {
  //     const redData = JSON.parse(data);
  //     const encryptedData = redData.data;
  //     const iv = encryptedData.slice(0, 16);
  //     const encryptedDataStr = encryptedData.slice(16);
  //     const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(encKey, 'hex'), Buffer.from(iv, 'hex'));
  //     let decryptedData = decipher.update(Buffer.from(encryptedDataStr, 'base64'), 'binary', 'utf8');
  //     decryptedData += decipher.final('utf8');
  //     console.log(decryptedData);
  //   });
  // });

  // req.on('error', (error) => {
  //   console.error(error);
  // });

  // req.write(postData);
  // req.end();

}

function decryptAirpayResponse(data, encKey) {
  try {
    console.log(data,encKey)
    const encryptedData = data;
    console.log(encryptedData)
    const iv = encryptedData.slice(0, 16);
    const encryptedDataStr = encryptedData.slice(16);
    console.log(encryptedDataStr)
    const decipher = crypto.createDecipheriv('aes-256-cbc', encKey, iv);
    decipher.setAutoPadding(true); // Set to use PKCS7 padding

    let decryptedData = decipher.update(Buffer.from(encryptedDataStr, 'base64'), null, 'utf8');
    console.log(decryptedData)
    decryptedData += decipher.final('utf8');
    
    console.log('My Decrypt Data', decryptedData);
  } catch (error) {
    console.error('Exception in decrypt:', error);
  }
}

async function createPaymentRequestAirpay(){
 const paymentdata= {
    "batch_code": "2022JAN",
    "batch_name": "Affiliate Payout Batch of January 2022",
    "transfers": [
        {
            "transfer_number": "10",
            "UID": "USER1",
            "payee_name": "John Brown",
            "payee_mobile": "9846030201",
            "bank_name": "SBI",
            "bank_account_type": "savings",
            "bank_account_number": "560002379833",
            "bank_ifsc": "SBIN0016387",
            "currency": "INR",
            "amount": 2500,
            "transfer_mode": "NEFT"
        },
        {
            "transfer_number": "11",
            "payee_name": "Shivam Sharma",
            "payee_mobile": "9846030201",
            "partner_bank_id": "100",
            "currency": "INR",
            "amount": 1850,
            "transfer_mode": "IMPS"
        }
    ]
}
const mercid = '294431';
const secretKey = "4z74sYwdqYUX6Pgv";
const username = "S8cyj8tS3m"
const password = "M3qt6RJk"
const secret = "4z74sYwdqYUX6Pgv"
const currentDate = date.format(new Date(), 'YYYY-MM-DD');

// Calculate the checksum using SHA-256
const checksumData = `${key256}@${alldata}${currentDate}`;
const checksum = crypto.createHash('sha256').update(checksumData).digest('hex');
console.log(checksum)

const data = {
mercid,
orderid,
amount: amt,
buyerPhone,
buyerEmail,
mer_dom,
call_type,
};

const encKey = crypto.createHash('md5').update(secret).digest('hex');
console.log(encKey)
const iv = crypto.randomBytes(8).toString('hex');
const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(encKey), iv);
let encData = cipher.update(JSON.stringify(data), 'utf8', 'base64');
encData += cipher.final('base64');
console.log(iv+encData)
const postData = JSON.stringify({
'encData': iv+encData,
'checksum': checksum,
'mercid': mercid,
});
}
async function airpayPayinStatus(details) {
  const merchant_id = process.env.AIRPAYMERCID;
  //const merchant_txn_id = details.txid;
  const date_f = details?.date;
  const username = process.env.AIRPAYUSERNAME;
  const password = process.env.AIRPAYPASSWORD;
  const secret = process.env.AIRPAYSECRET;
  const processor_id = details.txid
  // Generate key
  const key = crypto.createHash('sha256').update(`${username}~:~${password}`).digest('hex');

  const alldata = `${merchant_id}${processor_id}${date_f}`;

  // Calculate the checksum using SHA-256
  const checksumData = `${key}@${alldata}`;

  const checksum = crypto.createHash('sha256').update(checksumData).digest('hex');

  // Payment Gateway URL
  const paymentGatewayURL = "https://kraken.airpay.co.in/airpay/order/verify.php";
  const private_key = crypto.createHash('sha256').update(`${secret}@${username}:|:${password}`).digest('hex');

  // Prepare the POST data
  const postData = new URLSearchParams();
  postData.append('merchant_id', merchant_id);
  postData.append('processor_id', processor_id);
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
      function parseXmlString(xmlData) {
        return new Promise((resolve, reject) => {
          xml2js.parseString(xmlData, (err, result) => {
            if (err) {
              reject('Error parsing XML:', err);
            } else {
              resolve(result.RESPONSE.TRANSACTION);
            }
          });
        });
      }
      

      // Convert XML to JSON
      try {
        const transaction = await parseXmlString(xmlData);
        //console.log('Transaction:', transaction);
        return transaction[0];
      } catch (error) {
        console.error(error);
        return null;
      }
  } catch (error) {
      console.error('Error:', error);
  }
}
async function airpayPayinStatus2(details) {
  const merchant_id = process.env.AIRPAYMERCID2;
  //const merchant_txn_id = details.txid;
  const date_f = details?.date;
  const username = process.env.AIRPAYUSERNAME2;
  const password = process.env.AIRPAYPASSWORD2;
  const secret = process.env.AIRPAYSECRET2;
  const processor_id = details.txid
  // Generate key
  const key = crypto.createHash('sha256').update(`${username}~:~${password}`).digest('hex');

  const alldata = `${merchant_id}${processor_id}${date_f}`;

  // Calculate the checksum using SHA-256
  const checksumData = `${key}@${alldata}`;

  const checksum = crypto.createHash('sha256').update(checksumData).digest('hex');

  // Payment Gateway URL
  const paymentGatewayURL = "https://kraken.airpay.co.in/airpay/order/verify.php";
  const private_key = crypto.createHash('sha256').update(`${secret}@${username}:|:${password}`).digest('hex');

  // Prepare the POST data
  const postData = new URLSearchParams();
  postData.append('merchant_id', merchant_id);
  postData.append('processor_id', processor_id);
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
      //console.log("resp check",response)
      // if (!response.ok) {
      //     throw new Error('Network response was not ok');
      // }

      const xmlData = await response.text();
      function parseXmlString(xmlData) {
        return new Promise((resolve, reject) => {
          xml2js.parseString(xmlData, (err, result) => {
            if (err) {
              reject('Error parsing XML:', err);
            } else {
              resolve(result.RESPONSE.TRANSACTION);
            }
          });
        });
      }
      

      // Convert XML to JSON
      try {
        const transaction = await parseXmlString(xmlData);
        //console.log('Transaction:', transaction);
        return transaction[0];
      } catch (error) {
        console.error(error);
        return null;
      }
  } catch (error) {
      console.error('Error:', error);
  }
}

async function processAirpay(details, userData, uuid, adminDao, mapper, createTransaction, generatePhonePeURL, generateUpiUrl, usrConst) {
  const referenceId = Math.floor(Math.random() * 1000000000);

  const [response, gatewayData] = await Promise.all([
    airpayPayin(referenceId, details),
    adminDao.getGatewayDetails("airpay"),
  ]);

  const parsedResponse = JSON.parse(response);
  if (parsedResponse.status !== 200) {
    return mapper.responseMappingWithData(
      usrConst.CODE.INTRNLSRVR,
      usrConst.MESSAGE.internalServerError,
      response
    );
  }

  const { QRCODE_STRING, RID } = parsedResponse;
  const today = new Date();

  const updateDetails = {
    transactionId: RID,
    merchant_ref_no: RID,
    amount: details.amount,
    currency: "inr",
    country: "in",
    status: "IN-PROCESS",
    hash: "xyzAirpay",
    payout_type: "PAYIN",
    message: "IN-PROCESS",
    transaction_date: today.toISOString(),
    gateway: "airpay",
    phone: details.phone || "",
    username: details.username || "",
    upiId: details.upiId || "",
    customer_email: details.customer_email,
    business_name: userData.business_name,
  };

  const gatewayUpdate = {
    last24hrTotal: gatewayData.last24hrTotal + 1,
    totalTransactions: gatewayData.totalTransactions + 1,
  };

  await Promise.all([
    adminDao.updateGatewayDetailsPayin("airpay", gatewayUpdate),
    updateGatewayDetailsNew("airpay", gatewayUpdate),
    createTransaction({ ...updateDetails, uuid: String(uuid) }),
  ]);

  //console.log('here')
  const paytmUrl = generateUpiUrl("paytmmp://upi/pay", QRCODE_STRING);
  const gpayUrl = generateUpiUrl("tez://upi/pay", QRCODE_STRING);
  const phonepeUrl = generatePhonePeURL(QRCODE_STRING);
  return mapper.responseMappingWithData(
    usrConst.CODE.Success,
    usrConst.MESSAGE.Success,
    {
      url: QRCODE_STRING,
      transaction_id: RID,
      paytmUrl,
      gpayUrl,
      phonepeUrl,
    }
  );
}
module.exports = {
  sendAirpayQrRequest,

  encryptAirpayRequest,

  decryptAirpayResponse,

  check,

  check2,

  airpayPayin,
  
  airpayPayinStatus,

  processAirpay,

  airpayPayinStatus2
}