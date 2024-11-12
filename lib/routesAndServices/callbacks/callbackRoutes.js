const router = require("express").Router();
const service = require("./callbackServices");
const usrConst = require("../utils/userConstants");
const mapper = require("../utils/userMapper");

router.route("/pinwalletPayoutStatus").post((req, res) => {
  let details = req.body;
  console.log(req.body);
  service
    .pinwalletPayoutCallback(details)
    .then((result) => {
      res.send(result);
    })
    .catch((err) => {
      console.log({ err });
      res.send(
        mapper.responseMapping(
          usrConst.CODE.INTRNLSRVR,
          usrConst.MESSAGE.internalServerError
        )
      );
    });
});

router.route("/paytmePayoutStatus").post((req, res) => {
  let details = req.body;
  // console.log(req.body)
  service
    .paytmePayoutCallback(details)
    .then((result) => {
      res.send(result);
    })
    .catch((err) => {
      console.log({ err });
      res.send(
        mapper.responseMapping(
          usrConst.CODE.INTRNLSRVR,
          usrConst.MESSAGE.internalServerError
        )
      );
    });
});

router.route("/paytmePayinCallback").post((req, res) => {
  let details = req.body;
  console.log(req.body);
  service
    .saveTxPaytme(details)
    .then((result) => {
      res.send(result);
    })
    .catch((err) => {
      console.log({ err });
      res.send(
        mapper.responseMapping(
          usrConst.CODE.INTRNLSRVR,
          usrConst.MESSAGE.internalServerError
        )
      );
    });
});

router.route("/cashfreePayoutStatus").post((req, res) => {
  let details = req.body;
  console.log(req.body);
  service
    .cashfreePayoutCallback(details)
    .then((result) => {
      res.send(result);
    })
    .catch((err) => {
      console.log({ err });
      res.send(
        mapper.responseMapping(
          usrConst.CODE.INTRNLSRVR,
          usrConst.MESSAGE.internalServerError
        )
      );
    });
});

router.route("/pgbroPayin").post((req, res) => {
  let details = req.body;
  console.log(req.body);
  service
    .callbackPgbroPayin(details)
    .then((result) => {
      res.send(result);
    })
    .catch((err) => {
      console.log({ err });
      res.send(
        mapper.responseMapping(
          usrConst.CODE.INTRNLSRVR,
          usrConst.MESSAGE.internalServerError
        )
      );
    });
});

router.route("/kwikpaisaPayin").post((req, res) => {
  let details = req.body;
  console.log(req.body);
  service
    .saveTxKwikpaisa(details)
    .then((result) => {
      res.send(result);
    })
    .catch((err) => {
      console.log({ err });
      res.send(
        mapper.responseMapping(
          usrConst.CODE.INTRNLSRVR,
          usrConst.MESSAGE.internalServerError
        )
      );
    });
});

router.route("/razorpayPayinCallbackNew").get((req, res) => {
  // let details = req.body
  let detailsNew = req.params;
  let details = req.body;
  console.log(req.body);
  console.log(detailsNew);
  console.log(details?.payload?.payment);
  console.log("payment entity", details?.payload?.payment?.entity);
  console.log("order entity", details?.payload?.order?.entity);
  console.log("payment link entity", details?.payload?.payment_link?.entity);
  console.log(req.body);
  return res.status(200).send("success");
  // service.callbackPgbroPayin(details).then((result) => {

  //     res.send(result)
  // }).catch((err) => {

  //     console.log({ err })
  //     res.send(mapper.responseMapping(usrConst.CODE.INTRNLSRVR, usrConst.MESSAGE.internalServerError))
  // })
  // service.pinwalletPayoutCallback(details).then((result) => {

  //     res.send(result)
  // }).catch((err) => {

  //     console.log({ err })
  //     res.send(mapper.responseMapping(usrConst.CODE.INTRNLSRVR, usrConst.MESSAGE.internalServerError))
  // })
});

router.route("/razorpayPayinCallbackNew").post((req, res) => {
  let details = req.body;
  if (
    details?.payload?.payment_link?.entity &&
    details?.payload?.payment?.entity?.acquirer_data?.rrn &&
    details?.payload?.payment?.entity?.acquirer_data?.upi_transaction_id
  ) {
    let paymentData = details?.payload?.payment_link?.entity;
    paymentData.rrn = details?.payload?.payment?.entity?.acquirer_data?.rrn;
    paymentData.upi_transaction_id =
      details?.payload?.payment?.entity?.acquirer_data?.upi_transaction_id;
    console.log(paymentData);
    service
      .callbackRazorpayPayin(paymentData)
      .then((result) => {
        res.send(result);
      })
      .catch((err) => {
        console.log({ err });
        res.send(
          mapper.responseMapping(
            usrConst.CODE.INTRNLSRVR,
            usrConst.MESSAGE.internalServerError
          )
        );
      });
  } else {
    res.send(
      mapper.responseMapping(
        usrConst.CODE.INTRNLSRVR,
        usrConst.MESSAGE.internalServerError
      )
    );
  }
});

router.route("/razorpayPayoutCallback").post((req, res) => {
  let details = req.body;
  console.log(req.body);
  // service.pinwalletPayoutCallback(details).then((result) => {

  //     res.send(result)
  // }).catch((err) => {

  //     console.log({ err })
  //     res.send(mapper.responseMapping(usrConst.CODE.INTRNLSRVR, usrConst.MESSAGE.internalServerError))
  // })
});
router.route("/kwikpaisaPayout").post((req, res) => {
  let details = req.body;
  console.log(req.body);
  service
    .kwikpaisaPayoutCallback(details)
    .then((result) => {
      res.send(result);
    })
    .catch((err) => {
      console.log({ err });
      res.send(
        mapper.responseMapping(
          usrConst.CODE.INTRNLSRVR,
          usrConst.MESSAGE.internalServerError
        )
      );
    });
});
router.route("/airpayPayin").post((req, res) => {
  let details = req.body;
  console.log(req.body);
  service
    .saveTxAirpay(details)
    .then((result) => {
      res.send(result);
    })
    .catch((err) => {
      console.log({ err });
      res.send(
        mapper.responseMapping(
          usrConst.CODE.INTRNLSRVR,
          usrConst.MESSAGE.internalServerError
        )
      );
    });
});



module.exports = router;
