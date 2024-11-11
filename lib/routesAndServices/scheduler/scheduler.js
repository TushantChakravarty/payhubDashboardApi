const dao = require("../user/userDao");
const adminDao = require("../admin/adminDao");
const { getAllUserTx } = require("../admin/adminService");
const {
  pushDataForToday,
  fetchDataForCurrentDate,
  pushDataForTodayNew,
  fetchDataForCurrentDateNew,
  getAllGatewayData,
} = require("../utils/gatewayDao");
const { fetchTransactionStatusSwipeline } = require("../../gateways/swipeline");
const {
  getTransactionsSummaryYesterday,
} = require("../transactionsDao/TransactionDao");
const payoutsDao = require("../payouts/payoutsDao");
const { updateGatewayDetailsNew } = require("../gateway/gatewayDao");
const {
  fetchPayhubData,
  updatePayhubDataFields,
  archiveDailyData,
} = require("../utils/payhubDao");
const getPendingTx = async () => {
  const tx = await adminDao.getAllTransactionWithPendingStatus("IN-PROCESS");
  console.log(tx);
  const details = {
    mid: "SLCOS000019DELH",
    orderNo: "01575616246915714205",
  };
  const status = await fetchTransactionStatusSwipeline(details);
  console.log(status);
};

async function pushGatewayDetails() {
  const admin = await adminDao.getUserDetails({
    emailId: "samir123@payhub",
  });
  for (const item of admin.gateways) {
    await pushDataForToday(item);
  }
 
  //console.log(data)
  //  const data =await fetchDataForCurrentDate()
  //  console.log(data)
}

async function pushGatewayDetailsNew() {
  const gateways = await getAllGatewayData();


  for (const item of gateways) {
    //await pushDataForToday(item);
    await pushDataForTodayNew(item);
  }
  //console.log(data)
  //  const data =await fetchDataForCurrentDate()
  //  console.log(data)
}

async function updateGatewayDetails() {
  // const admin = await adminDao.getUserDetails({
  //   emailId: 'samir123@payhub'
  // });

  const data = await fetchDataForCurrentDate();

  for (const item of data) {
    const body = {
      yesterday: item.last24hr,
      yesterdayFee: item.feeCollected24hr,
      yesterdayTransactions: item.last24hrSuccess,
    };
   
    // console.log('body', body);

    await adminDao.updateGateway(item.gatewayName, body);
  }
 
}

async function updateGatewayDetailsNewReset() {
  // const admin = await adminDao.getUserDetails({
  //   emailId: 'samir123@payhub'
  // });

  const gateways = await getAllGatewayData();;
  console.log(gateways)
  
  for (const item of gateways) {
    const newUpdate = {
      yesterday: item.last24hr,
      yesterdayFee: item.feeCollected24hr,
      yesterdayTransactions: item.last24hrSuccess,
      last24hr: 0,
      last24hrSuccess: 0,
      last24hrTotal: 0,
      feeCollected24hr: 0,
    };
    await updateGatewayDetailsNew(item.gatewayName, newUpdate);

    // console.log('body', body);
  }
}

async function updateUser() {
  const users = await dao.getAllUsersTransactions();
  // console.log(users)
  users.map((item) => {
    const last24 = item.last24hr;

    let query = {
      emailId: item.emailId,
    };
    let updateObj = {
      last24hr: 0,
      yesterday: last24,
      last24hrSuccess: 0,
      last24hrTotal: 0,
      todayFee: 0,
      yesterdayFee: item.todayFee,
      yesterdayTransactions: item.last24hrSuccess,
    };
    //console.log(last24,yesterday)
    dao.updateProfile(query, updateObj);
  });
}

async function updateUserPayouts() {
  const users = await dao.getAllUsersTransactions();
  // console.log(users)
  users.map((item) => {
    const last24 = item.payoutsData.last24hr;

    let query = {
      emailId: item.emailId,
    };
    const updateObj = {
      $set: {
        "payoutsData.yesterday": last24,
        "payoutsData.last24hrSuccess": 0,
        "payoutsData.last24hrTotal": 0,
        //  "payoutsData.totalTransactions":Number(user.payoutsData.totalTransactions)+1,
        //  "payoutsData.successfulTransactions":Number(user.payoutsData.successfulTransactions)+1,
      },
    };
    // let updateObj ={
    //   last24hr:0,
    //   yesterday:last24,
    //   last24hrSuccess:0,
    //   last24hrTotal:0,
    //   todayFee:0,
    //   // yesterdayFee:item?.payoutsData?.todayFee,
    //   // yesterdayTransactions:item.payoutsData.last24hrSuccess
    // }
    //console.log(last24,yesterday)
    payoutsDao.updateUserProfile(query, updateObj);
    //dao.updateProfile(query,updateObj)
  });
}
async function updateAdminPayouts() {
  // const data = await adminDao.getAllTransactions({
  //   emailId: 'samir123@payhub'
  // });
  //console.log(data);
  const user = await payoutsDao.getPayoutsSummaryYesterday();
  console.log(user);
  const adminUpdateObj = {
    $set: {
      "payouts.yesterday": user?.totalAmount,
      "payouts.last24hrSuccess": 0,
      "payouts.last24hrTotal": 0,
    },
  };
  // const updateObj = {
  //   last24hr: 0,
  //   yesterday:user?.totalAmount,
  //   last24hrSuccess:0,
  //   last24hrTotal:0,
  //   feeCollected24hr:0,
  //   //yesterdayTransactions:data?.last24hrSuccess

  // };
  let query = {
    emailId: "samir123@payhub",
  };

  payoutsDao.updateAdminProfile(query, adminUpdateObj);
}
async function updateAdmin() {
  // const data = await adminDao.getAllTransactions({
  //   emailId: 'samir123@payhub'
  // });
  //console.log(data);
  const user = await getTransactionsSummaryYesterday();
  console.log(user);
  const updateObj = {
    last24hr: 0,
    yesterday: user?.totalAmount,
    last24hrSuccess: 0,
    last24hrTotal: 0,
    feeCollected24hr: 0,
    //yesterdayTransactions:data?.last24hrSuccess
  };
  let query = {
    emailId: "samir123@payhub",
  };

  adminDao.updateProfile(query, updateObj);
}
async function updateAdminYesterdayTx() {
  // const data = await adminDao.getAllTransactions({
  //   emailId: 'samir123@payhub'
  // });
  //console.log(data);
  const user = await getTransactionsSummaryYesterday();
  //console.log(typeof(user?.totalAmount))
  const updateObj = {
    yesterday: String(user?.totalAmount),

    //yesterdayTransactions:data?.last24hrSuccess
  };

  let query = {
    emailId: "samir123@payhub",
  };

  adminDao.updateProfile(query, updateObj);
}

async function resetPayhubData() {
  const data = await fetchPayhubData();
  const payhubUpdate = {
    yesterday: data?.last24hr,
    yesterdayTransactions: data?.last24hrSuccess,
    last24hr: 0,
    last24hrSuccess: 0,
    last24hrTotal:0
  };
  console.log("data check",data)
  await archiveDailyData(data)
  .then(async ()=>{
    await updatePayhubDataFields(payhubUpdate);
  })
}

async function myFunction() {
  console.log("This is myFunction being executed.");

  updateUser();

  // Wrap the updateAdmin call in a try-catch block to handle any potential errors
  try {
    updateAdmin();
    pushGatewayDetails();
    updateUserPayouts();
    updateAdminPayouts().then(() => {
      updateGatewayDetails();
      
    });
  } catch (error) {
    console.error("Error updating admin:", error);
  }
}

module.exports = {
  updateAdmin,

  myFunction,

  pushGatewayDetails,

  updateGatewayDetails,

  getPendingTx,

  updateAdminYesterdayTx,

  updateAdminPayouts,

  updateUserPayouts,

  pushGatewayDetailsNew,

  resetPayhubData,

  updateGatewayDetailsNewReset
};
