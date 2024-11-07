const { generateTransactionId } = require("../appUtils")
const CryptoJS = require('crypto-js')
const adminDao = require("../routesAndServices/admin/adminDao")
const fetch = require('node-fetch');
const { updateGatewayDetailsNew } = require("../routesAndServices/gateway/gatewayDao");
//import db from "../../db/index.js";
//const { PayoutTransaction, User } = db;
// Function to generate HMAC SHA-256 signature
function generateSignature(message, secretKey) {
  // Create HMAC SHA-256 signature
  const signature = CryptoJS.HmacSHA256(message, secretKey);

  // Encode the signature in Base64
  const base64Signature = CryptoJS.enc.Base64.stringify(signature);

  return base64Signature;
}

// Function to create an order
async function createOrder({
  appId,
  secretKey,
  orderId,
  orderAmount,
  orderCurrency,
  orderNote,
  serviceType,
  customerName,
  customerEmail,
  customerPhone,
  customerAddressLine1,
  customerAddressLine2,
  customerAddressCity,
  customerAddressState,
  customerAddressCountry,
  customerAddressPostalCode,
  returnUrl,
}) {
  // Construct the string to be signed (sorted string)
  const sortedString =
    "app_id" +
    appId +
    "customer_address_city" +
    customerAddressCity +
    "customer_address_country" +
    customerAddressCountry +
    "customer_address_line1" +
    customerAddressLine1 +
    "customer_address_line2" +
    customerAddressLine2 +
    "customer_address_postal_code" +
    customerAddressPostalCode +
    "customer_address_state" +
    customerAddressState +
    "customer_email" +
    customerEmail +
    "customer_name" +
    customerName +
    "customer_phone" +
    customerPhone +
    "order_amount" +
    orderAmount +
    "order_currency" +
    orderCurrency +
    "order_id" +
    orderId +
    "order_note" +
    orderNote +
    "return_url" +
    returnUrl +
    "service_type" +
    serviceType;
  // Generate the signature
  const orderChecksum = await generateSignature(sortedString, secretKey);

  // Prepare the payload for the order
  const payload = {
    order_id: orderId,
    order_amount: orderAmount,
    order_currency: orderCurrency,
    order_note: orderNote,
    service_type: serviceType,
    customer_name: customerName,
    customer_email: customerEmail,
    customer_phone: customerPhone,
    customer_address_line1: customerAddressLine1,
    customer_address_line2: customerAddressLine2,
    customer_address_city: customerAddressCity,
    customer_address_state: customerAddressState,
    customer_address_country: customerAddressCountry,
    customer_address_postal_code: customerAddressPostalCode,
    order_checksum: orderChecksum, // Signature is included here
    return_url: returnUrl,
  };
  console.log(JSON.stringify(payload))

  // Make the API request to create the order
  try {
    const response = await fetch(`${process.env.KWIKPAISAURL}/order`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-client-id": appId,
        "x-client-secret": secretKey,
        "order-source": "rest-api",
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    console.log("Order :", data);
    return data;
  } catch (error) {
    console.error("Error creating order:", error);
  }
}

// Function to make payment request
async function payOrderCollect({
  appId,
  secretKey,
  kwikXOrderId,
  upiId,
  channel = "collect", // Default value for channel is 'collect'
}) {
  // Prepare the payload for the payment request
  const payload = {
    kwikX_order_id: kwikXOrderId,
    payment_method: {
      upi: {
        upi_id: upiId, // Customer's UPI ID
        channel: channel,
      },
    },
  };

  // Make the API request
  try {
    const response = await fetch(`${process.env.KWIKPAISAURL}/payorder`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-client-id": appId,
        "x-client-secret": secretKey,
        "order-source": "rest-api",
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    // console.log("Payment request sent successfully:", data.return_data.payment_method);
    return data;
  } catch (error) {
    console.error("Error in sending payment request:", error);
  }
}

async function payOrder(appId, secretKey, kwikXOrderId, channel) {
  const payload = {
    kwikX_order_id: kwikXOrderId,
    payment_method: {
      upi: {
        channel: channel,
      },
    },
  };

  try {
    const response = await fetch(`${process.env.KWIKPAISAURL}/payorder`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-client-id": appId,
        "x-client-secret": secretKey,
        "order-source": "rest-api",
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    console.log("Response:", data);
    return data;
  } catch (error) {
    console.error("Error:", error);
  }
}

async function payOrderCard(appId, secretKey, kwikXOrderId, cardDetails) {
  const payload = {
    kwikX_order_id: kwikXOrderId,
    payment_method: {
      card: {
        card_name: cardDetails.card_name,
        card_number: cardDetails.card_number,
        card_exp: cardDetails.card_exp,
        card_cvv: cardDetails.card_cvv,
      },
    },
  };

  try {
    const response = await fetch(`${process.env.KWIKPAISAURL}/payorder`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-client-id": appId,
        "x-client-secret": secretKey,
        "order-source": "rest-api",
      },
      body: JSON.stringify(payload),
    });
    console.log("data resp", response);
    const data = await response.json();
    console.log("Response:", data);
    return data;
  } catch (error) {
    console.error("Error:", error);
  }
}

async function createUpiCollectRequest(details) {
  const {
    amount,
    customer_upi_id,
    customer_name,
    customer_emailId,
    customer_phone,
    customer_address,
    city,
    state,
    postal_code,
    returnUrl,
  } = details;
  try {
    console.log("upi", customer_upi_id);
    const order = await createOrder({
      appId: process.env.KWIKPAISAAPPID, // Your App ID
      secretKey: process.env.KWIKPAISASECRET, // Your Secret Key
      orderId: generateTransactionId(12),
      orderAmount: amount,
      orderCurrency: "INR",
      orderNote: "order",
      serviceType: "DIGITAL",
      customerName: customer_name,
      customerEmail: customer_emailId,
      customerPhone: customer_phone,
      customerAddressLine1: customer_address
        ? customer_address
        : "Capital Office, Kemp House",
      customerAddressLine2: customer_address
        ? customer_address
        : "152 - 160 City Road",
      customerAddressCity: city ? city : "delhi",
      customerAddressState: state ? state : "delhi",
      customerAddressCountry: "INDIA",
      customerAddressPostalCode: postal_code ? postal_code : "110011",
      returnUrl: returnUrl ? returnUrl : "xyz",
    });

    const response = await payOrderCollect({
      appId: process.env.KWIKPAISAAPPID, // Your App ID
      secretKey: process.env.KWIKPAISASECRET, // Your Secret Key
      kwikXOrderId: order.return_data.kwikX_order_id, // kwikX_order_id from the Order API
      upiId: customer_upi_id, // Customer's UPI ID
    });
    return response;
  } catch (error) {
    console.log("collect error kwikpaisa", error);
    return error;
  }
}

async function createUpiLinkRequest(details) {
  const {
    amount,
    upiId,
    customer_name,
    customer_emailId,
    customer_phone,
    customer_address,
    city,
    state,
    postal_code,
    returnUrl,
  } = details;
  try {
    const order = await createOrder({
      appId: process.env.KWIKPAISAAPPID, // Your App ID
      secretKey: process.env.KWIKPAISASECRET, // Your Secret Key
      orderId: generateTransactionId(12),
      orderAmount: amount,
      orderCurrency: "INR",
      orderNote: "order",
      serviceType: "DIGITAL",
      customerName: customer_name,
      customerEmail: customer_emailId,
      customerPhone: customer_phone,
      customerAddressLine1: customer_address
        ? customer_address
        : "Capital Office, Kemp House",
      customerAddressLine2: customer_address
        ? customer_address
        : "152 - 160 City Road",
      customerAddressCity: city ? city : "delhi",
      customerAddressState: state ? state : "delhi",
      customerAddressCountry: "INDIA",
      customerAddressPostalCode: postal_code ? postal_code : "110011",
      returnUrl: returnUrl ? returnUrl : "xyz",
    });

    console.log(order);
    const response = await payOrder(
      process.env.KWIKPAISAAPPID, // Your App ID
      process.env.KWIKPAISASECRET, // Your Secret Key
      order.return_data.kwikX_order_id,
      "link" // kwikX_order_id from the Order API
    );
    return response;
  } catch (error) {
    console.log("collect error kwikpaisa", error);
    return error;
  }
}

 async function createUpiQRRequest(details) {
  const {
    amount,
    customer_name,
    customer_emailId,
    customer_phone,
    customer_address,
    city,
    state,
    postal_code,
    returnUrl,
  } = details;
  try {
    const order = await createOrder({
      appId: process.env.KWIKPAISAAPPID, // Your App ID
      secretKey: process.env.KWIKPAISASECRET, // Your Secret Key
      orderId: generateTransactionId(12),
      orderAmount: amount,
      orderCurrency: "INR",
      orderNote: "order",
      serviceType: "DIGITAL",
      customerName: customer_name,
      customerEmail: customer_emailId,
      customerPhone: customer_phone,
      customerAddressLine1: customer_address
        ? customer_address
        : "Capital Office, Kemp House",
      customerAddressLine2: customer_address
        ? customer_address
        : "152 - 160 City Road",
      customerAddressCity: city ? city : "delhi",
      customerAddressState: state ? state : "delhi",
      customerAddressCountry: "INDIA",
      customerAddressPostalCode: postal_code ? postal_code : "110011",
      returnUrl: returnUrl ? returnUrl : "xyz",
    });

    console.log(order);
    const response = await payOrder(
      process.env.KWIKPAISAAPPID, // Your App ID
      process.env.KWIKPAISASECRET, // Your Secret Key
      order.return_data.kwikX_order_id,
      "qr" // kwikX_order_id from the Order API
    );
    return response;
  } catch (error) {
    console.log("collect error kwikpaisa", error);
    return error;
  }
}

async function createUpiIntentRequest(details) {
  const {
    amount,
    username,
    customer_email,
    phone,
    customer_address,
    city,
    state,
    postal_code,
    returnUrl,
  } = details;
  try {
    const txId = generateTransactionId(12)
    const order = await createOrder({
      appId: process.env.KWIKPAISAAPPID, // Your App ID
      secretKey: process.env.KWIKPAISASECRET, // Your Secret Key
      orderId: txId,
      orderAmount: amount,
      orderCurrency: "INR",
      orderNote: "order",
      serviceType: "DIGITAL",
      customerName: username,
      customerEmail: customer_email,
      customerPhone: phone,
      customerAddressLine1: customer_address
        ? customer_address
        : "Capital Office, Kemp House",
      customerAddressLine2: customer_address
        ? customer_address
        : "152 - 160 City Road",
      customerAddressCity: city ? city : "delhi",
      customerAddressState: state ? state : "delhi",
      customerAddressCountry: "INDIA",
      customerAddressPostalCode: postal_code ? postal_code : "110011",
      returnUrl: returnUrl ? returnUrl : `https://server.payhub.link?order_id=${txId}`,
    });

    console.log(order);
    const response = await payOrder(
      process.env.KWIKPAISAAPPID, // Your App ID
      process.env.KWIKPAISASECRET, // Your Secret Key
      order.return_data.kwikX_order_id,
      "app" // kwikX_order_id from the Order API
    );
    return response;
  } catch (error) {
    console.log("collect error kwikpaisa", error);
    return error;
  }
}

async function createCardPaymentRequest(details) {
  const {
    amount,
    username,
    customer_email,
    phone,
    customer_address,
    city,
    state,
    postal_code,
    returnUrl,
  } = details;
  try {
    const orderId =generateTransactionId(20)
    let server_url = `https://widget.usdtmarketplace.com/confirm?type=onramp&order_id=${orderId}`
    const body = {
      appId: process.env.KWIKPAISAAPPID, // Your App ID
      secretKey: process.env.KWIKPAISASECRET, // Your Secret Key
      orderId: orderId,
      orderAmount: amount,
      orderCurrency: "INR",
      orderNote: "order",
      serviceType: "DIGITAL",
      customerName: username,
      customerEmail: customer_email,
      customerPhone: phone,
      customerAddressLine1: customer_address
        ? customer_address
        : "Capital Office, Kemp House",
      customerAddressLine2: customer_address
        ? customer_address
        : "152 - 160 City Road",
      customerAddressCity: city ? city : "delhi",
      customerAddressState: state ? state : "delhi",
      customerAddressCountry: "INDIA",
      customerAddressPostalCode: postal_code ? postal_code : "110011",
      returnUrl: server_url 
    };
    console.log("body", body);
    const order = await createOrder(body);

    console.log(order);
    // const body ={
    //   card_name: "John Deo",
    //   card_number: "4747 4747 4747 4747",
    //   card_exp: "12/25",
    //   card_cvv: "680"
    // }
    // const response = await payOrderCard(
    //   process.env.KWIKPAISAAPPID,  // Your App ID
    //   process.env.KWIKPAISASECRET,  // Your Secret Key
    //   order.return_data.kwikX_order_id,
    //   body
    // );
    return order;
  } catch (error) {
    console.log("card error kwikpaisa", error);
    return error;
  }
}

async function createNetbankingPaymentRequest(details) {
  const {
    amount,
    customer_name,
    customer_emailId,
    customer_phone,
    customer_address,
    city,
    state,
    postal_code,
    returnUrl,
  } = details;
  try {
    const order = await createOrder({
      appId: process.env.KWIKPAISAAPPID, // Your App ID
      secretKey: process.env.KWIKPAISASECRET, // Your Secret Key
      orderId: generateTransactionId(12),
      orderAmount: amount,
      orderCurrency: "INR",
      orderNote: "order",
      serviceType: "DIGITAL",
      customerName: customer_name,
      customerEmail: customer_emailId,
      customerPhone: customer_phone,
      customerAddressLine1: customer_address
        ? customer_address
        : "Capital Office, Kemp House",
      customerAddressLine2: customer_address
        ? customer_address
        : "152 - 160 City Road",
      customerAddressCity: city ? city : "delhi",
      customerAddressState: state ? state : "delhi",
      customerAddressCountry: "INDIA",
      customerAddressPostalCode: postal_code ? postal_code : "110011",
      returnUrl: returnUrl ? returnUrl : "xyz",
    });

    console.log(order);
    const body = {
      bankName: "SBI",
    };
    const response = await payOrderCard(
      process.env.KWIKPAISAAPPID, // Your App ID
      process.env.KWIKPAISASECRET, // Your Secret Key
      order.return_data.kwikX_order_id,
      body
    );
    return response;
  } catch (error) {
    console.log("collect error kwikpaisa", error);
    return error;
  }
}

async function initiatePayoutBankRequest(
  appId,
  secretKey,
  kwikXWalletID,
  payoutDetails,
  userData
) {
  const payload = {
    kwikx_wallet_id: kwikXWalletID,
    debit_account_type: "kwikx_wallet",
    transfer_type: "direct",
    beneficiary_id: String(userData._id), // You can pass actual beneficiary_id if needed
    mobile: payoutDetails.customer_phone,
    email: payoutDetails.customer_email,
    address: null, // Address can be set if available
    country_dialing_code: "91",
    transfer_mode: "imps",
    transfer_amount: payoutDetails.amount,
    account_transfer: {
      account_owner_name: payoutDetails.account_name,
      account_number: payoutDetails.account_number,
      ifsc_code: payoutDetails.bank_ifsc,
      is_validate: "false",
      payment_for: "product buying",
    },
    payout_order_id: generateTransactionId(12),
  };
  console.log(JSON.stringify(payload));

  try {
    const response = await fetch(
      `${process.env.KWIKPAISAPAYOUTURL}/payment/initiate-request`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-client-id": appId,
          "x-client-secret": secretKey,
          "order-source": "reset-api",
        },
        body: JSON.stringify(payload),
      }
    );
    if (!response.ok) {
      console.log(response);
      throw Error("unable to process payout request at the moment");
    }

    const data = await response.json();
    console.log("Response:", data);
    return data;
  } catch (error) {
    console.error("Error:", error.message);
  }
}

async function initiatePayoutUPIRequest(
  appId,
  secretKey,
  kwikXWalletID,
  payoutDetails
) {
  const payload = {
    kwikx_wallet_id: kwikXWalletID,
    debit_account_type: "kwikx_wallet",
    transfer_type: "direct",
    beneficiary_id: payoutDetails.customer_id, // You can pass actual beneficiary_id if needed
    mobile: payoutDetails.phone,
    email: payoutDetails.email,
    address: null, // Address can be set if available
    country_dialing_code: "91",
    transfer_mode: 'upi',
    transfer_amount: payoutDetails.amount,
    upi_transfer: {
      upi_owner_name: payoutDetails.name,
      upi_id: payoutDetails.upi,
      is_validate: 'false',
      payment_for: payoutDetails.description,
    },
    payout_order_id: generateTransactionId(12),
  };
  console.log(JSON.stringify(payload));
  try {
    const response = await fetch(
      `${process.env.KWIKPAISAPAYOUTURL}/payment/initiate-request`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-client-id": appId,
          "x-client-secret": secretKey,
          "order-source": "reset-api",
        },
        body: JSON.stringify(payload),
      }
    );
    if (!response.ok) {
      console.log(response);
      throw Error("unable to process upi payout request at the moment");
    }

    const data = await response.json();
    console.log("Response:", data);
    return data;
  } catch (error) {
    console.error("Error:", error.message);
  }
}

async function createInstantPayoutBankRequest(details,dao,mapper,userData,usrConst,gateway) {
  try {
    console.log(
      process.env.KWIKPAISAAPPIDPAYOUTS,
      process.env.KWIKPAISASECRETPAYOUTS
    );
    const response = await initiatePayoutBankRequest(
      process.env.KWIKPAISAAPPIDPAYOUTS, // Your App ID
      process.env.KWIKPAISASECRETPAYOUTS, // Your Secret Key
      process.env.KWIKPAISAWALLETID,
      details,
      userData
    );
    if(response.code==200&&response.unique_system_order_id)
    {

     
      const timeElapsed = Date.now();
      const today = new Date(timeElapsed);
      const updateDetails = {
        uuid: userData._id,
        transactionId: response.unique_system_order_id,
        merchant_ref_no: response.merchant_payout_order_id,
        amount: details?.amount,
        currency: "inr",
        country: "india",
        status: "pending",
        transaction_type: "payout",
        transaction_date: today.toISOString(),
        gateway: gateway,
        phone: details?.phone,
        customer_name: details?.customer_name,
        upiId: details?.customer_upiId,
        account_number: details?.account_number,
        account_name: details?.account_name,
        ifsc_code: details?.bank_ifsc,
        bank_name: details?.bank_name,
        customer_email: details?.customer_email,
        business_name: userData.business_name,
        payoutAmount: details?.amount,
        comission: 0,
        utr:'',
        method:'bank'

      };
     const updated = await dao.createTransaction(updateDetails);
     let query = {
      emailId: userData.emailId,
    };
     const user = await dao.getUserDetails(query)
     const admin = await adminDao.getUserDetails({
      emailId:'samir123@payhub'
     })
     user.payoutBalance = Number(user.payoutBalance) - Number(details.amount)
     admin.payoutsBalance = Number(admin.payoutsBalance) - Number(details.amount)
     const updatedUser = await user.save()
     const adminUpdated = await admin.save()
    // console.log(updatedUser,adminUpdated)
     if (updated) {
      return mapper.responseMappingWithData(
        usrConst.CODE.Success,
        usrConst.MESSAGE.Success,
        {message:"Payment request submitted",transaction_id:response.unique_system_order_id}
      );
    } else {
      return mapper.responseMappingWithData(
        usrConst.CODE.INTRNLSRVR,
        usrConst.MESSAGE.TransactionFailure,
        "Unable to process transaction at the moment"
      );
    }
    }else{
      return mapper.responseMappingWithData(
        usrConst.CODE.INTRNLSRVR,
        usrConst.MESSAGE.TransactionFailure,
        "Unable to process transaction at the moment"
      );
    }
  } catch (error) {
    console.log("payout bank error kwikpaisa", error);
    return mapper.responseMappingWithData(
      usrConst.CODE.INTRNLSRVR,
      usrConst.MESSAGE.TransactionFailure,
      "Unable to process transaction at the moment"
    );
  }
}

 async function createInstantPayoutUpiRequest(details, user, usdt_rate) {
  try {
    const response = await initiatePayoutUPIRequest(
      process.env.KWIKPAISAAPPIDPAYOUTS, // Your App ID
      process.env.KWIKPAISASECRETPAYOUTS, // Your Secret Key
      process.env.KWIKPAISAWALLETID,
      details
    );
    if(response.code==200&&response.unique_system_order_id)
    {

      const payout_user = await User.findOne({ where: { id: user.id } });
      payout_user.payoutBalance -= details.amount;
      await payout_user.save();
      await PayoutTransaction.create({
        uuid: user.id,
        amount: details.amount,
        currency: "inr",
        country: "ind",
        status: "pending",
        transaction_type: "payout",
        transaction_date: Date.now(),
        gateway: "kwikpaisa",
        phone: details.phone || "",
        customer_name: details.name || "",
        account_name: details.name || "",
        customer_email: details.email || "",
        business_name: user.business_name,
        payoutAmount: details.amount,
        method: "upi",
        upiId: details.upi,
        payout_address: details?.payout_address ? details?.payout_address : "",
        usdt_rate: usdt_rate,
        transactionId: response.unique_system_order_id,
        customer_id:details.customer_id
      });
      return response;
    }else{
      return false
    }
  } catch (error) {
    console.log("payout upi error kwikpaisa", error);
    return error;
  }
}

async function processKwikpaisa(details, userData, uuid, adminDao, mapper,createTransaction, generateUpiUrl, generatePhonePeURL,usrConst) {
  const response = await createUpiIntentRequest(details);
  const upiDetails = response.return_data.payment_method.upi;

  if (!upiDetails) {
    return mapper.responseMappingWithData(
      usrConst.CODE.INTRNLSRVR,
      usrConst.MESSAGE.internalServerError,
      response
    );
  }

  const today = new Date();
  const gatewayData = await adminDao.getGatewayDetails("kwikpaisa");

  const gatewayUpdate = {
    last24hrTotal: gatewayData.last24hrTotal + 1,
    totalTransactions: gatewayData.totalTransactions + 1,
  };

  const updateDetails = {
    transactionId: response.return_data.kwikX_payment_id,
    merchant_ref_no: response.return_data.kwikX_payment_id,
    amount: details.amount,
    currency: "inr",
    country: "in",
    status: "IN-PROCESS",
    hash: "kwikpaisaxyz",
    payout_type: "PAYIN",
    message: "IN-PROCESS",
    transaction_date: today.toISOString(),
    gateway: "kwikpaisa",
    phone: details.phone || "",
    username: details.username || "",
    upiId: details.upiId || "",
    customer_email: details.customer_email,
    business_name: userData.business_name,
  };

  await Promise.all([
    adminDao.updateGatewayDetailsPayin("kwikpaisa", gatewayUpdate),
    updateGatewayDetailsNew("kwikpaisa", gatewayUpdate),
    createTransaction({ ...updateDetails, uuid: String(uuid) }),
  ]);

  const originalUrl = upiDetails.deepLink;
  const paytmUrl = generateUpiUrl("paytmmp://upi/pay", originalUrl);
  const gpayUrl = generateUpiUrl("tez://upi/pay", originalUrl);
  const phonepeUrl = generatePhonePeURL(originalUrl);

  return mapper.responseMappingWithData(
    usrConst.CODE.Success,
    usrConst.MESSAGE.Success,
    {
      url: originalUrl,
      transaction_id: response.return_data.kwikX_payment_id,
      paytmUrl,
      gpayUrl,
      phonepeUrl,
    }
  );
}

async function processKwikpaisaPageRequest(details, userData, uuid, adminDao, mapper,createTransaction,usrConst) {
  
  const response = await createCardPaymentRequest(details);
  const cardDetails = response.return_data.payment_link;

  if (!cardDetails) {
    return mapper.responseMappingWithData(
      usrConst.CODE.INTRNLSRVR,
      usrConst.MESSAGE.internalServerError,
      response
    );
  }

  const today = new Date();
  const gatewayData = await adminDao.getGatewayDetails("kwikpaisa");

  const gatewayUpdate = {
    last24hrTotal: gatewayData.last24hrTotal + 1,
    totalTransactions: gatewayData.totalTransactions + 1,
  };

  const updateDetails = {
    transactionId: response.return_data.order_id,
    merchant_ref_no: response.return_data.kwikX_order_id,
    amount: details.amount,
    currency: "inr",
    country: "in",
    status: "IN-PROCESS",
    hash: "kwikpaisaxyz",
    payout_type: "PAYIN",
    message: "IN-PROCESS",
    transaction_date: today.toISOString(),
    gateway: "kwikpaisa",
    phone: details.phone || "",
    username: details.username || "",
    upiId: details.upiId || "",
    customer_email: details.customer_email,
    business_name: userData.business_name,
  };

  await Promise.all([
    adminDao.updateGatewayDetailsPayin("kwikpaisa", gatewayUpdate),
    updateGatewayDetailsNew("kwikpaisa",gatewayUpdate),
    createTransaction({ ...updateDetails, uuid: String(uuid) }),
  ]);

 
  return mapper.responseMappingWithData(
    usrConst.CODE.Success,
    usrConst.MESSAGE.Success,
    {
      url: cardDetails,
      transaction_id: response.return_data.order_id,
    }
  );
}

// const test ={
//   customer_name:'tushant',
//   customer_emailId:'xyz@gmail.com',
//   amount:100,
//   customer_phone:'9340079982',
//   returnUrl:'server.payhub.link'

// }

// createCardPaymentRequest(test)

// const payoutDetails = {
//   mobile: "9896989698",
//   email: "email@example.com",
//   country_dialing_code: "91",
//   transfer_mode: "imps",
//   transfer_amount: "10.12",
//   account_owner_name: "tushant",
//   account_number: "20323508372",
//   ifsc_code: "sbin0007258",
//   is_validate: "false",
//   payment_for: "salary payment",
//   payout_order_id: "6548945984787998"
// };
// const payoutDetailsUpi = {
//   mobile: "9896989698",
//   email: "email@example.com",
//   country_dialing_code: "91",
//   transfer_mode: "upi",
//   transfer_amount: "10.12",
//   upi_owner_name: "tushant",
//   upi_id: "tushant029@oksbi",
//   is_validate: "false",
//   payment_for: "salary payment",
//   payout_order_id: "6548945984787899"
// };

//createInstantPayoutBankRequest(payoutDetails)
//createInstantPayoutUpiRequest(payoutDetailsUpi)
module.exports ={
  createUpiIntentRequest,

  processKwikpaisa,

  processKwikpaisaPageRequest,

  createInstantPayoutUpiRequest,

  createInstantPayoutBankRequest
}