const crypto = require('crypto');
const axios = require('axios');
const CryptoJS = require('crypto-js');

const sendSwipelineQrRequest = async (details) => {

console.log(details)
const response = await axios.post('https://merchant.swipelinc.com/paymentrequest/seamless', details, {
  headers: {
    'Content-Type': 'application/json',
  }
})
  .then(response => {
    // Handle the response data
    console.log('Response:', response.data);
    return response.data
  })
  .catch(error => {
    // Handle errors and log the entire error object for debugging
    console.error('Error:', error);
  });
  return response
  }

  function encryptData(plainText, encryptkey) {
    try {
      const encryptKey = Buffer.from(encryptkey, 'utf-8');

      // Your plaintext JSON object
      const plaintextObject = {
        key1: 'value1',
        key2: 'value2',
        // Add your JSON properties here
      };
      
      // Convert the JSON object to a string
      const plaintext = JSON.stringify(plainText);
      
      // Generate a random IV (Initialization Vector)
      const iv = crypto.randomBytes(16);
      
      // Create an AES cipher
      const cipher = crypto.createCipheriv('aes-256-cbc', encryptKey, iv);
      
      // Encrypt the data
      let encryptedData = cipher.update(plaintext, 'utf-8', 'base64');
      encryptedData += cipher.final('base64');
      
      // Combine IV and encrypted data
      const combinedBytes = Buffer.concat([iv, Buffer.from(encryptedData, 'base64')]);
      
      // Encode the combined data as Base64
      const base64Encoded = combinedBytes.toString('base64');
      
      //console.log(base64Encoded);
      return base64Encoded
    } catch (e) {
      console.error(`Exception in encrypt() : encryptData- ${encryptkey} : Message- ${e.message}`);
    }
    return null;
  }

  const swipeLineUpi = async (data)=>{
   
      const encryptedData = encryptData(data,data.enckey)
      console.log('my enc data',encryptedData)
      const details ={
        "mid":"SLCOS00028WES",
        "payload":encryptedData    
        }
     const response =await sendSwipelineQrRequest(details)
     return response
  }

  function decryptData(encryptedString) {
    try {
      const encryptKey = "wnn7v1f7hb00cz644giewcjl6z8l63xo"
      const encryptedData = Buffer.from(encryptedString, 'base64');

      // Extract the initialization vector (IV) and the encrypted bytes
      const ivBytes = encryptedData.slice(0, 16);
      const encryptedBytes = encryptedData.slice(16);
  
      // Convert the encryption key to a Buffer
      const keyBuffer = Buffer.from(encryptKey, 'utf-8');
  
      // Create a decipher instance with the AES algorithm and PKCS5 padding
      const decipher = crypto.createDecipheriv('aes-256-cbc', keyBuffer, ivBytes);
      decipher.setAutoPadding(true);
  
      // Decrypt the data
      let decryptedData = decipher.update(encryptedBytes, 'binary', 'utf-8');
      decryptedData += decipher.final('utf-8');
  
      return decryptedData;

    } catch (e) {
      console.error("Exception in decryptData(): encryptKey- "  + " : Message- " + e.message);
      return null;
    }
  }


  const sendPayoutRequestSwipelineIMPS = async (details)=>
  {
    //console.log(details)
const response = await axios.post('https://payout.swipelinc.com/swipelinc-payout/core-banking/initiate-payout', details, {
  headers: {
    'Content-Type': 'application/json',
  }
})
  .then(response => {
    // Handle the response data
    
    console.log('Response:', response);
    return response.data
  })
  .catch(error => {
    // Handle errors and log the entire error object for debugging
    console.error('Error:', error.response.data);
    return 'internal server error'
  });
  return response
  }


  const fetchTransactionStatusSwipeline = async (details)=>
  {
    //console.log(details)
const response = await axios.post('https://merchant.swipelinc.com/api/v1/transaction/status-orderno', details, {
  headers: {
    'Content-Type': 'application/json',
  }
})
  .then(response => {
    // Handle the response data
    
    console.log('Response:', response);
    return response.data
  })
  .catch(error => {
    // Handle errors and log the entire error object for debugging
    console.error('Error:', erro.response.datar);
    return 'internal server error'
  });
  return response
  }

module.exports={
    sendSwipelineQrRequest,
    swipeLineUpi,
    decryptData,
    sendPayoutRequestSwipelineIMPS,
    fetchTransactionStatusSwipeline
}