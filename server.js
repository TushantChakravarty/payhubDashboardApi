"use strict";

console.log("");
console.log("//API SANDWICH BACKEND//");
console.log("");
const environment = "prod";
require("dotenv").config({ path: `.env.${environment}` });
var res = require("dotenv").config();
const { initCronJobs } = require("./crons");
const config = require("./lib/config");
const {
  getTotalVolume,
  updateVolumeData,
  updateGatewayVolumeData,
  merchantLogsUpdater,
  addPreviousDayLogs,
} = require("./lib/routesAndServices/admin/adminDao");
const {
  updateAdminYesterdayTx,
} = require("./lib/routesAndServices/scheduler/scheduler");
const {
  updatePendingTransactionStatus,
  updatePendingTransactionStatus2,
  updatePendingTransactionStatusNew,
  updatePendingTransactionStatus3New,
  updatePendingTransactionStatus2New,
  updatePendingTransactionStatus4New,
} = require("./lib/routesAndServices/scheduler/statusScheduler");
//const { connectRedis } = require("./lib/routesAndServices/utils/redis");
const {
  findParticularTx,
} = require("./lib/routesAndServices/utils/transactionDao");
//const { payhubBankScrapper } = require("./lib/gateways/payhub")
const client = require("prom-client");

//connectRedis()

//initCronJobs()
//addPreviousDayLogs('success')
//payhubBankScrapper()
//findParticularTx()

config.dbConfig((err) => {
  if (err) {
    // logger.error(err, 'exiting the app.');

    console.log({ err });
    return;
  } else {
    //updatePendingTransactionStatus();
    //updatePendingTransactionStatus2()
    //updatePendingTransactionStatus3New()
    //updatePendingTransactionStatusNew()
    //updatePendingTransactionStatus4New()
    //updatePendingTransactionStatus2New()

    //  getTotalVolume("success")
    //  updateVolumeData("success")
    //  updateGatewayVolumeData()
  }

  console.log("check updates");
  // load external modules
  const express = require("express");

  // init express app
  const app = express();
  const collectDefaultMetrics = client.collectDefaultMetrics;
  collectDefaultMetrics();

  // Create custom metrics
  const httpRequestDuration = new client.Histogram({
    name: "http_request_duration_seconds",
    help: "Duration of HTTP requests in seconds",
    labelNames: ["method", "route", "status_code"],
  });

  app.use((req, res, next) => {
    const end = httpRequestDuration.startTimer();
    res.on("finish", () => {
      end({
        method: req.method,
        route: req.route?.path || req.path,
        status_code: res.statusCode,
      });
    });
    next();
  });

  // Metrics endpoint
  app.get("/metrics", (req, res) => {
    res.set("Content-Type", client.register.contentType);
    res.end(client.register.metrics());
  });

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
