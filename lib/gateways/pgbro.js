const { generateTransactionId } = require("../appUtils");

async function pgBroPayin(
  details,
  createTransaction,
  mapper,
  userData,
  gateway,
  uuid,
  usrConst
) {
  const apiUrl = "https://merchantapi.pgbro.com/transactions/createtransaction";

  const payload = {
    merchant_id: process.env.PGBRO_MERCHANT_ID,
    api_key: process.env.PGBRO_MERCHANT_APIKEY,
    transaction_id: generateTransactionId(14),
    amount: details?.amount,
    user_name: details?.username,
    mobile_no: details?.phone,
    email: details?.customer_email,
  };

  const queryString = new URLSearchParams(payload).toString();

  // Construct the full URL with query string
  const fullUrl = `${apiUrl}?${queryString}`;

  // Fetch options
  const options = {
    method: "POST",
  };

  // Make the fetch request
  const response = await fetch(fullUrl, options)
    .then((response) => {
      if (!response.ok) {
        return mapper.responseMappingWithData(
          usrConst.CODE.INTRNLSRVR,
          usrConst.MESSAGE.internalServerError,
          "internal server error"
        );
      }
      return response.json();
    })
    .then((data) => {
      console.log(data);
      return {
        code: 200,
        urls: data?.success,
        transaction_id: data?.success?.transaction_id,
      };
    })
    .catch((error) => console.error("Error:", error));

  console.log(response)

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
      transactionId: response?.transaction_id,
      merchant_ref_no: response?.transaction_id,
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
        url: response?.urls?.qr_image,
        // upiUrl: JSON.parse(response).QRCODE_STRING,
        transaction_id: response?.data?.transaction_id,
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
async function pgBroPayinPage(
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
  const apiUrl = "https://merchantapi.pgbro.com/transactions/createtransaction";

  const payload = {
    merchant_id: process.env.PGBRO_MERCHANT_ID,
    api_key: process.env.PGBRO_MERCHANT_APIKEY,
    transaction_id: generateTransactionId(14),
    amount: details?.amount,
    user_name: details?.username,
    mobile_no: details?.phone,
    email: details?.customer_email,
  };

  const queryString = new URLSearchParams(payload).toString();

  // Construct the full URL with query string
  const fullUrl = `${apiUrl}?${queryString}`;

  // Fetch options
  const options = {
    method: "POST",
  };

  // Make the fetch request
  const response = await fetch(fullUrl, options)
    .then((response) => {
      console.log(response)
      // if (!response.ok) {
      //   return mapper.responseMappingWithData(
      //     usrConst.CODE.INTRNLSRVR,
      //     usrConst.MESSAGE.internalServerError,
      //     "internal server error"
      //   );
      // }
      return response.json();
    })
    .then((data) => {
      console.log(data);
      return {
        code: 200,
        urls: data?.success,
        transaction_id: data?.success?.transaction_id,
      };
    })
    .catch((error) => console.error("Error:", error));

  console.log(response)

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
      transactionId: response?.transaction_id,
      merchant_ref_no: response?.transaction_id,
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
      gpayurl: response.urls.gpayurl,
      paytmurl: response.urls.paytmurl,
      phonepeurl: response.urls.phonepeurl,
      upiurl: response.urls.upiurl,
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

    let url = `https://payments.payhub.link/?amount=${details.amount}&email=${details.emailId}&phone=${details.phone}&username=${username}&txid=${response.transaction_id}&gateway=payhubPG&gpay=${gpayurl}&phonepe=${phonepeurl}&paytm=${paytmurl}&upi=${upiurl}&qr=${upiurl}&token=${token}`;
    if (redirectUrl) {
      url = `https://payments.payhub.link/?amount=${details.amount}&email=${details.emailId}&phone=${details.phone}&username=${username}&txid=${response.transaction_id}&gateway=payhubPG&qr=${upiurl}&url=${redirectUrl}&gpay=${gpayurl}&phonepe=${phonepeurl}&paytm=${paytmurl}&upi=${upiurl}&token=${token}`;
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
        transaction_id: response.transaction_id,
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
module.exports = {
  pgBroPayin,

  pgBroPayinPage
};
