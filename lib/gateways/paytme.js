const fetch = require("node-fetch");

async function paytmePayin(details) {
  const referenceId = Math.floor(Math.random() * 1000000000);
  console.log(referenceId);
  const response = await fetch("https://apis.paytme.com/v1/merchant/payin", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET,PUT,POST,DELETE,PATCH,OPTIONS",
      "x-api-key": "188944e683bd2b4b01229449f27ee8c5",
      // 'IPAddress':'103.176.136.226',
      // Authentication: 'Bearer {eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI5OTkwMDA4NjYzIiwibmFtZWlkIjoiMTQ3IiwiZW1haWwiOiJpbmZvQHdlcm5lci5hc2lhIiwianRpIjoiOTM0ODIyYzktNjk0Ny00MTJhLWE2ZTgtZmRmYzNiMzdkYjMyIiwiZXhwIjoxNjk1ODIyMjgzLCJpc3MiOiJFenVsaXhiMmIiLCJhdWQiOiJFenVsaXhiMmIifQ.VdcZVGxitNcqJ_sjWMGQ2uU7P24HIVQkAi_TjyFD9zM}'
    },
    body: JSON.stringify({
      userContactNumber: details?.phone,
      merchantTransactionId: referenceId?.toString(),
      amount: details?.amount,
      name: details?.username,
      email: details?.customer_email,
    }),
  })
    .then((resp) => resp.json())
    .then((json) => {
      console.log(json);
      if (json) return json;
      return false;
    })
    .catch((error) => {
      console.log(error);
    });
  return response;
}

async function fetchPaytmePayinStatus(details) {
  const response = await fetch(
    `https://apis.paytme.com/v1/merchant/payin/${details?.transaction_id}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET,PUT,POST,DELETE,PATCH,OPTIONS",
        "x-api-key": "188944e683bd2b4b01229449f27ee8c5",
        // 'IPAddress':'103.176.136.226',
        // Authentication: 'Bearer {eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI5OTkwMDA4NjYzIiwibmFtZWlkIjoiMTQ3IiwiZW1haWwiOiJpbmZvQHdlcm5lci5hc2lhIiwianRpIjoiOTM0ODIyYzktNjk0Ny00MTJhLWE2ZTgtZmRmYzNiMzdkYjMyIiwiZXhwIjoxNjk1ODIyMjgzLCJpc3MiOiJFenVsaXhiMmIiLCJhdWQiOiJFenVsaXhiMmIifQ.VdcZVGxitNcqJ_sjWMGQ2uU7P24HIVQkAi_TjyFD9zM}'
      },
    }
  )
    .then((resp) => resp.json())
    .then((json) => {
      //console.log(json)
      if (json) return json;
      return false;
    })
    .catch((error) => {
      console.log(error);
    });
  return response;
}

async function fetchPaytmePayoutStatus(details) {
  const response = await fetch(
    `https://apis.paytme.com/v1/merchant/payout/status/${details?.transaction_id}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET,PUT,POST,DELETE,PATCH,OPTIONS",
        "x-api-key": "188944e683bd2b4b01229449f27ee8c5",
        // 'IPAddress':'103.176.136.226',
        // Authentication: 'Bearer {eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI5OTkwMDA4NjYzIiwibmFtZWlkIjoiMTQ3IiwiZW1haWwiOiJpbmZvQHdlcm5lci5hc2lhIiwianRpIjoiOTM0ODIyYzktNjk0Ny00MTJhLWE2ZTgtZmRmYzNiMzdkYjMyIiwiZXhwIjoxNjk1ODIyMjgzLCJpc3MiOiJFenVsaXhiMmIiLCJhdWQiOiJFenVsaXhiMmIifQ.VdcZVGxitNcqJ_sjWMGQ2uU7P24HIVQkAi_TjyFD9zM}'
      },
    }
  )
    .then((resp) => resp.json())
    .then((json) => {
      //console.log(json)
      if (json) return json;
      return false;
    })
    .catch((error) => {
      console.log(error);
    });
  return response;
}

async function paytmePaymentQr(
  details,
  createTransaction,
  mapper,
  userData,
  gateway,
  uuid,
  usrConst
) {
  const response = await paytmePayin(details);
  if (response.code == 200) {
    const timeElapsed = Date.now();

    // const gatewayData = await adminDao.getGatewayDetails(
    //   "paythrough"
    // );
    // const gatewayUpdate = {
    //   last24hrTotal: gatewayData.last24hrTotal + 1,
    //   totalTransactions: gatewayData.totalTransactions + 1,
    // };
    // console.log('gatewayData', gatewayUpdate)
    const today = new Date(timeElapsed);

    const updateDetails = {
      transactionId: response?.data?.transaction_id,
      merchant_ref_no: response?.data?.transaction_id,
      amount: details.amount,
      currency: "inr",
      country: "in",
      status: "IN-PROCESS",
      hash: "xyzAirpay",
      payout_type: "PAYIN",
      message: "IN-PROCESS",
      transaction_date: today.toISOString(),
      gateway: gateway,
      phone: details.phone ? details.phone : "",
      username: details.username ? details.username : "",
      upiId: details.upiId ? details.upiId : "",
      customer_email: details.customer_email,
      business_name: userData.business_name,
      uuid: String(uuid),
    };

    //adminDao.updateGatewayDetailsPayin("airpay", gatewayUpdate);
    //let newData = updateDetails;
    //newData.uuid = String(uuid);
    createTransaction(updateDetails);

    return mapper.responseMappingWithData(
      usrConst.CODE.Success,
      usrConst.MESSAGE.Success,
      {
        //url: url,
        url: response?.data?.upiurl,
        // upiUrl: JSON.parse(response).QRCODE_STRING,
        transaction_id: response?.data?.transaction_id,
      }
    );
  } else {
    return mapper.responseMappingWithData(
      usrConst.CODE.INTRNLSRVR,
      usrConst.MESSAGE.internalServerError,
      response
    );
  }
}

async function paytmePaymentPage(
  details,
  createTransaction,
  mapper,
  userData,
  gateway,
  uuid,
  usrConst,
  jwtHandler,
  redirectUrl
) {
  const response = await paytmePayin(details);
 // console.log(response)
  if (response.code == 200) {
    const timeElapsed = Date.now();

    // const gatewayData = await adminDao.getGatewayDetails(
    //   "paythrough"
    // );
    // const gatewayUpdate = {
    //   last24hrTotal: gatewayData.last24hrTotal + 1,
    //   totalTransactions: gatewayData.totalTransactions + 1,
    // };
    // console.log('gatewayData', gatewayUpdate)
    const today = new Date(timeElapsed);

    const updateDetails = {
      transactionId: response?.data?.transaction_id,
      merchant_ref_no: response?.data?.transaction_id,
      amount: details.amount,
      currency: "inr",
      country: "in",
      status: "IN-PROCESS",
      hash: "xyzPaytme",
      payout_type: "PAYIN",
      message: "IN-PROCESS",
      transaction_date: today.toISOString(),
      gateway: gateway,
      phone: details.phone ? details.phone : "",
      username: details.username ? details.username : "",
      upiId: details.upiId ? details.upiId : "",
      customer_email: details.customer_email,
      business_name: userData.business_name,
      uuid: String(uuid),
    };

    //adminDao.updateGatewayDetailsPayin("airpay", gatewayUpdate);
    //let newData = updateDetails;
    //newData.uuid = String(uuid);
    createTransaction(updateDetails);

    const urls = {
      gpayurl: response.data.gpayurl,
      paytmurl: response.data.paytmurl,
      phonepeurl: response.data.phonepeurl,
      upiurl: response.data.upiurl,
    };
    const gpayurl = encodeURIComponent(urls.gpayurl);
    const phonepeurl = encodeURIComponent(urls.phonepeurl);
    const paytmurl = encodeURIComponent(urls.paytmurl);
    const upiurl = encodeURIComponent(urls.upiurl);
    const token = await jwtHandler.generatePageExpiryToken(
      details.emailId,
      details.apiKey
    );
    const username = details.username.replace(/\s/g, "");

    let url = `https://payments.payhub.link/?amount=${details.amount}&email=${details.emailId}&phone=${details.phone}&username=${username}&txid=${response.data.transaction_id}&gateway=payhubPE&gpay=${gpayurl}&phonepe=${phonepeurl}&paytm=${paytmurl}&upi=${upiurl}&qr=${upiurl}&token=${token}`;
    if (redirectUrl) {
      url = `https://payments.payhub.link/?amount=${details.amount}&email=${details.emailId}&phone=${details.phone}&username=${username}&txid=${response.data.transaction_id}&gateway=payhubPE&qr=${upiurl}&url=${redirectUrl}&gpay=${gpayurl}&phonepe=${phonepeurl}&paytm=${paytmurl}&upi=${upiurl}&token=${token}`;
    }
    // adminDao.updateGatewayDetailsPayin("bazarpay", gatewayUpdate);
    //console.log(url)
    //dao.updateTransaction(query, updateDetails);
    return mapper.responseMappingWithData(
      usrConst.CODE.Success,
      usrConst.MESSAGE.Success,
      {
        url: url,
        //url:resp.success.upiurl,
        //upiUrl: urls.upiurl,
        transaction_id: response.data.transaction_id,
      }
    );
  } else {
    return mapper.responseMappingWithData(
      usrConst.CODE.INTRNLSRVR,
      usrConst.MESSAGE.internalServerError,
      "internal server error"
    );
  }
}

async function createPayoutPaytme(details) {
  console.log(JSON.stringify({
    amount: details?.amount,
    name: details?.customer_name,
    email: details?.customer_email,
    phone: details?.customer_phone,
    accountNumber: details?.account_number,
    bankIfsc: details?.bank_ifsc,
    accountHolderName: details?.account_name,
    bankName: details?.bank_name,
    upi: "",
    purpose: "",
  }))
  const response = await fetch(`https://apis.paytme.com/v1/payout`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET,PUT,POST,DELETE,PATCH,OPTIONS",
      "x-api-key": "188944e683bd2b4b01229449f27ee8c5",
      // 'IPAddress':'103.176.136.226',
      // Authentication: 'Bearer {eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI5OTkwMDA4NjYzIiwibmFtZWlkIjoiMTQ3IiwiZW1haWwiOiJpbmZvQHdlcm5lci5hc2lhIiwianRpIjoiOTM0ODIyYzktNjk0Ny00MTJhLWE2ZTgtZmRmYzNiMzdkYjMyIiwiZXhwIjoxNjk1ODIyMjgzLCJpc3MiOiJFenVsaXhiMmIiLCJhdWQiOiJFenVsaXhiMmIifQ.VdcZVGxitNcqJ_sjWMGQ2uU7P24HIVQkAi_TjyFD9zM}'
    },
    body: JSON.stringify({
      amount: details?.amount,
      name: details?.customer_name,
      email: details?.customer_email,
      phone: details?.customer_phone,
      accountNumber: details?.account_number,
      bankIfsc: details?.bank_ifsc,
      accountHolderName: details?.account_name,
      bankName: details?.bank_name,
      upi: "",
      purpose: "",
    }),
  })
    .then((resp) => resp.json())
    .then((json) => {
      console.log(json)
      if (json) return json;
      return false;
    })
    .catch((error) => {
      console.log(error);
    });
  return response;
}

async function createPaytmePayoutRequest(details, dao, mapper, userData,usrConst,gateway) {
  const response = await createPayoutPaytme(details);
  console.log(response)
  if (response?.code==200) {
    const timeElapsed = Date.now();
    const today = new Date(timeElapsed);
    const updateDetails = {
      uuid: userData._id,
      transactionId: response?.data?.id,
      merchant_ref_no: response?.data?.merchantId,
      amount: response?.data?.amount,
      currency: "inr",
      country: "india",
      status: "pending",
      transaction_type: "payout",
      transaction_date: today.toISOString(),
      gateway: gateway,
      phone: details?.phone,
      customer_name: details?.customer_name,
      upiId: "",
      account_number: details?.account_number,
      account_name: details?.account_name,
      ifsc_code: details?.bank_ifsc,
      bank_name: details?.bank_name,
      customer_email: details?.customer_email,
      business_name: userData.business_name,
      payoutAmount: response?.data?.payoutAmount,
      comission: response?.data?.payoutCommission,
    };
   const updated = await dao.createTransaction(updateDetails);
   //console.log(updated)
    if (updated) {
      return mapper.responseMappingWithData(
        usrConst.CODE.Success,
        usrConst.MESSAGE.Success,
        {message:"Payment request submitted",transaction_id:response?.data?.id}
      );
    } else {
      return mapper.responseMappingWithData(
        usrConst.CODE.INTRNLSRVR,
        usrConst.MESSAGE.TransactionFailure,
        "Unable to process transaction at the moment"
      );
    }
  }else {
    return mapper.responseMappingWithData(
      usrConst.CODE.INTRNLSRVR,
      usrConst.MESSAGE.TransactionFailure,
      "Unable to process transaction at the moment"
    );
  }
}

module.exports = {
  paytmePayin,

  paytmePaymentQr,

  paytmePaymentPage,

  fetchPaytmePayinStatus,

  createPayoutPaytme,

  createPaytmePayoutRequest,

  fetchPaytmePayoutStatus
};


