const Razorpay = require("razorpay")

const fetch = require('node-fetch');
const { generateTransactionId } = require("../appUtils");

async function createPaymentLinkViaRazorpay() {
  try {
    console.log("checkpoint 1")
      // Razorpay instance
      const razorpay = new Razorpay({
          key_id: process.env.RAZORPAY_KEY_ID,
          key_secret: process.env.RAZORPAY_KEY_SECRET
      })

      console.log("checkpoint 2")

      // generate payment link
      const response = await razorpay?.paymentLink?.create({
          // "upi_link": true, // true if you want to generate upi link
          "amount": 100,
          "currency": "INR",
          "accept_partial": true,
          "first_min_partial_amount": 100,
          "expire_by": new Date().getTime() + 24 * 7 * 60 * 60 * 1000, // 7 days in milliseconds
          "reference_id": generateTransactionId(10),
          "description": "",
          "customer": {
              "name": "test_user",
              "email": "test@gmail.com",
              "contact": "8318089088"
          },
          "notify": {
              "sms": false,
              "email": false
          },
          "reminder_enable": true,
          //  "callback_url": `${process.env.LIVE_URL}/callback/razorpayPayinCallback`, // callback url, i.e where to redirect user after payment
          //  "callback_method": "post",
          "options": {
              "checkout": {
                  "name": "razarpaytest",
                  "theme": {
                      "hide_topbar": true
                  }
                  // "method": { // Customize payment methods visibility on checkout form
                  //     "netbanking": "1",
                  //     "card": "1",
                  //     "upi": "0",
                  //     "wallet": "0"
                  // }
              }
          }
      })
      console.log("checkpoint 3")
      console.log(response)
      console.log("checkpoint 4")
      if (!response) throw new Error("Unable to generate payment link");

      console.log(response)
  } catch (err) {
      console.log(`PaymentService.createPaymentLinkViaRazorpay: ${err}`);
      console.table(err)
  }
}

async function createQrCode() {
    try {
      console.log("checkpoint 1")
        // Razorpay instance
        const razorpay = new Razorpay({
            key_id: process.env.RAZORPAY_KEY_ID,
            key_secret: process.env.RAZORPAY_KEY_SECRET
        })
  
        // var instance = new Razorpay({ key_id: 'YOUR_KEY_ID', key_secret: 'YOUR_SECRET' })
        console.log('main checkpoint')
        const currentUnixTime = Math.floor(Date.now() / 1000); // Current time in Unix timestamp (seconds)
const threeMinutesLater = currentUnixTime + (3 * 60);

     const response = await  razorpay.qrCode.create({
  type: "upi_qr",
  name: "Store Front Display",
  usage: "single_use",
  fixed_amount: true,
  payment_amount: 300,
  description: "For Store 1",
  customer_id: "cust_1Aa00000000004",
  close_by: threeMinutesLater,
  notes: {
    purpose: "Test UPI QR Code notes"
  }
})
        if (!response) throw new Error("Unable to generate payment link");
  
        console.log(response)
    } catch (err) {
        console.log(`PaymentService.createPaymentLinkViaRazorpay: ${err}`);
        console.table(err)
    }
  }



const createPayout = async () => {
  console.log("checkpoint 1")
  const keyId = process.env.RAZORPAY_KEY_ID
const keySecret = process.env.RAZORPAY_KEY_SECRET

console.log("checkpoint 2")

const basicAuth = Buffer.from(`${keyId}:${keySecret}`).toString('base64');
  const payoutData = {
    account_number: '7878780080316316',
    fund_account_id: 'NgkKZYsLyxcpOv',
    amount: 1000000,
    currency: 'INR',
    mode: 'IMPS',
    purpose: 'refund',
    queue_if_low_balance: true,
    reference_id: 'Acme Transaction ID 12345',
    narration: 'Acme Corp Fund Transfer',
    notes: {
      notes_key_1: 'Tea, Earl Grey, Hot',
      notes_key_2: 'Tea, Earl Grey… decaf.'
    }
  };

  console.log("checkpoint 3",basicAuth)

  try {
    const response = await fetch('https://api.razorpay.com/v1/payouts', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${basicAuth}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payoutData)
    });

    console.log("checkpoint 4")

    if (!response.ok) {
      console.log(response)
      throw new Error('Network response was not ok');
    }

    console.log("checkpoint 4")
    const data = await response.json();
    console.log("checkpoint 5")
    console.log('Payout created successfully:', data);
  } catch (error) {
    console.error('Error creating payout:', error);
  }
};




async function createRazorpayContact(){
  try{
    const keyId = process.env.RAZORPAY_KEY_ID
    const keySecret = process.env.RAZORPAY_KEY_SECRET

    const basicAuth = Buffer.from(`${keyId}:${keySecret}`).toString('base64');

    const request_body = {
      name: "Shubhanshu tripathi",
      email: "tshubhanshu007@gmaail.com",
      contact: 8318089088,
      type: "employee",
      reference_id: "Acme Contact ID 12345",
      notes:{
        random_key_1: "Make it so.",
        random_key_2: "Tea. Earl Grey. Hot."
      }
    }

    const response = await fetch('https://api.razorpay.com/v1/contacts', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${basicAuth}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(request_body)
    });

    if (!response.ok) {
      console.log(response)
      throw new Error('Network response was not ok');
    }

    console.log("checkpoint 4")
    const data = await response.json();
    console.log("checkpoint 5")
    console.log('contact created successfully:', data);
    
  }catch(err){
    console.log(`razorpayService.js-createRazorpayContact`,err);
  }
}

 async function createRazorpayFundAccountForBank(){
  try{
    const keyId = process.env.RAZORPAY_KEY_ID
    const keySecret = process.env.RAZORPAY_KEY_SECRET

const basicAuth = Buffer.from(`${keyId}:${keySecret}`).toString('base64');

   const request_body = {
    "contact_id": "cont_O81BzbKgs3GCG9",
    "account_type": "bank_account",
    "bank_account": {
      "name": "Subhanshu kumar tripathi",
      "ifsc": "BARB0KASHYA",
      "account_number": "31778100032723"
    }
  }
    const response = await fetch('https://api.razorpay.com/v1/fund_accounts', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${basicAuth}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(request_body)
    });

    if (!response.ok) {
      console.log(response)
      throw new Error('Network response was not ok');
    }

    
    const data = await response.json();
   
    console.log('fund account created successfully:', data);
    
  }catch(err){
    console.log(`razorpayService.js-createRazorpayContact`,err);
  }
}
async function createRazorpayFundAccountForVpa(){
  try{
    const keyId = process.env.RAZORPAY_KEY_ID
    const keySecret = process.env.RAZORPAY_KEY_SECRET

const basicAuth = Buffer.from(`${keyId}:${keySecret}`).toString('base64');

   const request_body = {
    contact_id: "cont_O81BzbKgs3GCG9",
    account_type: "vpa",
    vpa: {
      address: "8318089088@ybl"
    }
  }
  
    const response = await fetch('https://api.razorpay.com/v1/fund_accounts', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${basicAuth}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(request_body)
    });

    if (!response.ok) {
      console.log(response)
      throw new Error('Network response was not ok');
    }

    
    const data = await response.json();
   
    console.log('fund account created successfully:', data);
    
  }catch(err){
    console.log(`razorpayService.js-createRazorpayContact`,err);
  }
}



module.exports={
  createPaymentLinkViaRazorpay,
  createQrCode,
  createPayout,
  createRazorpayContact,
  createRazorpayFundAccountForBank,
  createRazorpayFundAccountForVpa
}