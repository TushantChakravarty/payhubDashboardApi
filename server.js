"use strict";

console.log("");
console.log("//API SANDWICH BACKEND//");
console.log("");
require("dotenv").config();
var res = require("dotenv").config();
const { initCronJobs } = require("./crons");
const config = require("./lib/config");
const { updatePendingTransactionStatus } = require("./lib/routesAndServices/scheduler/statusScheduler");
const { connectRedis } = require("./lib/routesAndServices/utils/redis");
const { findParticularTx } = require("./lib/routesAndServices/utils/transactionDao");
//const { payhubBankScrapper } = require("./lib/gateways/payhub")

connectRedis()


//initCronJobs()

// updatePendingTransactionStatus()
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