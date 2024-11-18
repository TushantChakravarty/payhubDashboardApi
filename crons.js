"use strict";


require("dotenv").config();
const cron = require("node-cron");
const {
  myFunction,
  updateAdmin,
  updateAdminYesterdayTx,
  resetPayhubData,
  updateGatewayDetailsNewReset,
} = require("./lib/routesAndServices/scheduler/scheduler");
const adminDao = require("./lib/routesAndServices/admin/adminDao");
const {
  getTransactionsSummaryYesterday,
} = require("./lib/routesAndServices/transactionsDao/TransactionDao");
const {
  updatePendingTransactionStatus,
} = require("./lib/routesAndServices/scheduler/statusScheduler");
const {
  updateVolumeDataPayouts,
  getTotalAdminVolumePayouts,
  updatePayoutsBalanceMerchants,
} = require("./lib/routesAndServices/payouts/payoutsDao");

// Define all cron jobs
function initCronJobs() {

//   // Daily admin update at 18:30
  cron.schedule("0 30 18 * * *", async () => {
    const admin = await adminDao.getUserDetails({ emailId: "samir123@payhub" });
    const lastExecutionDate = admin.lastExecutionDate;
    const currentDate = new Date().toISOString().split("T")[0];

    if (lastExecutionDate !== currentDate) {
      // Run your functions
      myFunction();
      updateAdmin();
      // resetPayhubData()
      // updateGatewayDetailsNewReset()
      //updateAdminYesterdayTx();
      console.log("Running daily admin update.");

      // Update the last execution date
      const update = { lastExecutionDate: currentDate };
      await adminDao.updateProfile({ emailId: "samir123@payhub" }, update);
    }
  });

  cron.schedule("0 30 18 * * *", async () => {
    const admin = await adminDao.getUserDetails({ emailId: "samir123@payhub" });
    const lastExecutionDate = admin.lastExecutionDate;
    const currentDate = new Date().toISOString().split("T")[0];

    if (lastExecutionDate !== currentDate) {
      // Run your functions
     
      resetPayhubData()
      updateGatewayDetailsNewReset()
      console.log("Running daily admin&gateway data update.");

    
    }
  });

  // Update admin for yesterday's transactions at 18:40
  // cron.schedule("0 40 18 * * *", async () => {
  //   updateAdminYesterdayTx();
  // });

  // Every 30 minutes, update the gateway volume data
// cron.schedule('*/30 * * * *', async () => {
//   adminDao.updateGatewayVolumeData();
// });

// Every 50 minutes, update volume data and payouts
// cron.schedule('*/50 * * * *', async () => {
//   await adminDao.updateVolumeData("success");
//   await adminDao.getTotalVolume("success");
//   await adminDao.updateGatewayVolumeData();
//   await updateVolumeDataPayouts("success");
//   await getTotalAdminVolumePayouts("success");
// });

// Every 3 hours, update gateway balance and admin balances

cron.schedule('0 */3 * * *', async () => {
  await adminDao.updateTotalGatewayBalance();
  await adminDao.updateBalanceMerchants();
  await adminDao.updateBalanceAdmin();
});
// clear pending transactions in batches fro  12:00 am to 2:00 Am
// cron.schedule("0 45 18 * * *", async () => {
//     console.log('Starting batch processing at 12:15 AM IST...');
//     await updatePendingTransactionStatus();
//     console.log('Batch processing window completed.');
// });
//  adminDao.updateVolumeData("success");
//  adminDao.getTotalVolume("success");
//  adminDao.updateGatewayVolumeData();
  console.log('All cron jobs have been initialized.');
}

// Export the init function
module.exports = { initCronJobs };
