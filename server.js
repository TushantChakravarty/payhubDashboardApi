"use strict";

console.log("");
console.log("//API SANDWICH BACKEND//");
console.log("");
const environment =  "prod";
require("dotenv").config({ path: `.env.${environment}` });
var res = require("dotenv").config();
const { initCronJobs } = require("./crons");
const config = require("./lib/config");
const { getTotalVolume, updateVolumeData, updateGatewayVolumeData, merchantLogsUpdater, addPreviousDayLogs } = require("./lib/routesAndServices/admin/adminDao");
const { updateAdminYesterdayTx } = require("./lib/routesAndServices/scheduler/scheduler");
const { updatePendingTransactionStatus, updatePendingTransactionStatus2 } = require("./lib/routesAndServices/scheduler/statusScheduler");
//const { connectRedis } = require("./lib/routesAndServices/utils/redis");
const { findParticularTx } = require("./lib/routesAndServices/utils/transactionDao");
//const { payhubBankScrapper } = require("./lib/gateways/payhub")

//connectRedis()


initCronJobs()
//addPreviousDayLogs('success')
//merchantLogsUpdater()
//updateAdminYesterdayTx()
//updatePendingTransactionStatus2()
//updatePendingTransactionStatus()
// getTotalVolume("success")
// updateVolumeData("success")
// updateGatewayVolumeData()
//payhubBankScrapper()
//findParticularTx()
config.dbConfig((err) => {
  if (err) {
    // logger.error(err, 'exiting the app.');

    console.log({ err });
    return;
  }

  console.log('check updates')
  // load external modules
  const express = require("express");

  // init express app
  const app = express();
  app.set("trust proxy", true);

  // config express
  config.expressConfig(app);
  if (err) return res.json(err);

  // attach the routes to the app
  require("./lib/routes")(app);

  const port = process.env.PORT || 2000; // start server
 app.listen(port, () => {
    console.log(`Express server listening on ${port}`);
    // logger.info(`Express server listening on ${config.cfg.port}, in ${config.cfg.TAG} mode`);
  });
});
