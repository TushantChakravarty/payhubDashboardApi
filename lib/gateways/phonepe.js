const crypto = require('crypto');
const axios = require('axios');

const salt_key = process.env.PHONEPESALTKEY//"0b1ab943-cf1b-49cd-84a5-27131fcb909f"
const merchant_id = process.env.PHONEPEMERCHANTID//"M15N4WTCAKPN"
//eyJzdWNjZXNzIjp0cnVlLCJjb2RlIjoiUEFZTUVOVF9TVUNDRVNTIiwibWVzc2FnZSI6IllvdXIgcGF5bWVudCBpcyBzdWNjZXNzZnVsLiIsImRhdGEiOnsibWVyY2hhbnRJZCI6Ik0xNU40V1RDQUtQTiIsIm1lcmNoYW50VHJhbnNhY3Rpb25JZCI6IjM3NjI5MDA5OSIsInRyYW5zYWN0aW9uSWQiOiJUMjMxMTI3MjI0MjQ4OTA3NDk3MDI5MyIsImFtb3VudCI6NTAwLCJzdGF0ZSI6IkNPTVBMRVRFRCIsInJlc3BvbnNlQ29kZSI6IlNVQ0NFU1MiLCJwYXltZW50SW5zdHJ1bWVudCI6eyJ0eXBlIjoiVVBJIiwidXRyIjoiMzMzMTU0NTkzMTQ0IiwiY2FyZE5ldHdvcmsiOm51bGwsImFjY291bnRUeXBlIjoiU0FWSU5HUyJ9fX0=
const newPayment = async (details, createTransaction, mapper,usrConst) => {
    try {
        // console.log("this is the salt_key", salt_key)
        // console.log("this is the salt_key", merchant_id)
        const merchantTransactionId = Math.floor(Math.random() * 1000000000);
        //'TRAN76885322JXZ';
        const data = {
            merchantId: merchant_id,
            merchantTransactionId: merchantTransactionId,
            merchantUserId: 'Tushant',
            name: details.username,
            amount: details.amount * 100,
            redirectUrl: `https://www.payhub.link`,
            callbackUrl:"https://server.payhub.link/admin/savetxphonepe",
            redirectMode: 'POST',
            mobileNumber: details.phone,
            paymentInstrument: {
                type: 'PAY_PAGE'
            }
        };


        const payload = JSON.stringify(data);
        const payloadMain = Buffer.from(payload).toString('base64');
        const keyIndex = 1;
        const string = payloadMain + '/pg/v1/pay' + salt_key;
        const sha256 = crypto.createHash('sha256').update(string).digest('hex');
        const checksum = sha256 + '###' + keyIndex;

        const prod_URL = "https://api.phonepe.com/apis/hermes/pg/v1/pay"
        const options = {
            method: 'POST',
            url: prod_URL,
            headers: {
                accept: 'application/json',
                'Content-Type': 'application/json',
                'X-VERIFY': checksum
            },
            data: {
                request: payloadMain
            }
        };

        console.log(checksum)
        console.log(">>>>>>>>>>>>>>>>>>>>>>>>>>", payloadMain)


       const response = await axios.request(options).then(function (response) {
        //console.log(response)
            console.log(response.data.data.instrumentResponse)
            return response.data
            //.instrumentResponse.redirectInfo.url
            //eturn res.redirect(response.data.data.instrumentResponse.redirectInfo.url)
        })
            .catch(function (error) {
                console.error(error);
            });
            if (response.success === true) {
                const timeElapsed = Date.now();
                const today = new Date(timeElapsed);
      
                const updateDetails = {
                  transactionId: response.data.merchantTransactionId,
                  merchant_ref_no: response.data.merchantId,
                  amount: details.amount,
                  currency: "inr",
                  country: "in",
                  status: "IN-PROCESS",
                  hash: "xyzPhonepe",
                  payout_type: "PAYIN",
                  message: "IN-PROCESS",
                  transaction_date: today.toISOString(),
                  gateway: gateway,
                  phone: details.phone || "",
                  username: details.username || "",
                  upiId: details.upiId || "",
                  customer_email: details.customer_email,
                  business_name: userData.business_name,
                  uuid: String(uuid),
                };
      
                await createTransaction(updateDetails);
      
                const resp = {
                  transaction_id: response.data.merchantTransactionId,
                  transaction_date: today.toISOString(),
                  url: response.data.instrumentResponse.redirectInfo.url
                };
      
                return mapper.responseMappingWithData(
                  usrConst.CODE.Success,
                  usrConst.MESSAGE.Success,
                  resp
                );
              } else {
                return mapper.responseMappingWithData(
                  usrConst.CODE.INTRNLSRVR,
                  usrConst.MESSAGE.internalServerError,
                  response
                );
              }

    } catch (error) {
        // res.status(500).send({
        //     message: error.message,
        //     success: false
        // })
        console.log(error)
    }
}

const newPaymentQR = async (details) => {
    try {
        // console.log("this is the salt_key", salt_key)
        // console.log("this is the salt_key", merchant_id)
        const merchantTransactionId = Math.floor(Math.random() * 1000000000);
        //'TRAN76885322JXZ';
        const data = {
            merchantId: merchant_id,
            merchantTransactionId: merchantTransactionId,
            merchantUserId: 'Tushant',
            name: details.username,
            amount: details.amount * 100,
            redirectUrl: `https://www.payhub.link`,
            callbackUrl:"https://server.payhub.link/admin/savetxphonepe",
            redirectMode: 'POST',
            mobileNumber: details.phone,
            paymentInstrument: {
                type: 'UPI_QR'
            }
        };


        const payload = JSON.stringify(data);
        const payloadMain = Buffer.from(payload).toString('base64');
        const keyIndex = 1;
        const string = payloadMain + '/pg/v1/pay' + salt_key;
        const sha256 = crypto.createHash('sha256').update(string).digest('hex');
        const checksum = sha256 + '###' + keyIndex;

        const prod_URL = "https://api.phonepe.com/apis/hermes/pg/v1/pay"
        const options = {
            method: 'POST',
            url: prod_URL,
            headers: {
                accept: 'application/json',
                'Content-Type': 'application/json',
                'X-VERIFY': checksum
            },
            data: {
                request: payloadMain
            }
        };

        console.log(checksum)
        console.log(">>>>>>>>>>>>>>>>>>>>>>>>>>", payloadMain)


       const response = await axios.request(options).then(function (response) {
        console.log(response)
            console.log(response.data.data.instrumentResponse)
            return response
            //.instrumentResponse.redirectInfo.url
            //eturn res.redirect(response.data.data.instrumentResponse.redirectInfo.url)
        })
            .catch(function (error) {
                console.error(error);
            });
        return response

    } catch (error) {
        // res.status(500).send({
        //     message: error.message,
        //     success: false
        // })
        console.log(error)
    }
}

const checkStatus = async (req, res) => {
    const merchantTransactionId = res.req.body.transactionId
    const merchantId = res.req.body.merchantId

    const keyIndex = 1;
    const string = `/pg/v1/status/${merchantId}/${merchantTransactionId}` + salt_key;
    const sha256 = crypto.createHash('sha256').update(string).digest('hex');
    const checksum = sha256 + "###" + keyIndex;

    const options = {
        method: 'GET',
        url: `https://api.phonepe.com/apis/hermes/pg/v1/status/${merchantId}/${merchantTransactionId}`,
        headers: {
            accept: 'application/json',
            'Content-Type': 'application/json',
            'X-VERIFY': checksum,
            'X-MERCHANT-ID': `${merchantId}`
        }
    };

    // CHECK PAYMENT TATUS
    axios.request(options).then(async (response) => {
        if (response.data.success === true) {
            const url = `http://localhost:3000/success`
            return res.redirect(url)
        } else {
            const url = `http://localhost:3000/failure`
            return res.redirect(url)
        }
    })
        .catch((error) => {
            console.error(error);
        });
};

module.exports = {
    newPayment,
    newPaymentQR,
    checkStatus
}