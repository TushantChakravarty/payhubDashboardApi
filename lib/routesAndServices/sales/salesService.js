const appUtils = require("../../appUtils")
const Sales = require("../../generic/models/salesModel")
const jwtHandler = require("../../jwtHandler")
async function Login(req, res) {
  try {
    const { emailId, password } = req.body

    if (emailId && emailId === "") {
      return res.send({
        responseCode: 403,
        responseMessage: "Please enter a valid Email"
      })
    }

    if (password && password === "") {
      return res.send({
        responseCode: 403,
        responseMessage: "Please enter a valid password"
      })
    }
    const sales = await Sales.findOne({ emailId: emailId }).select('+password');
    if (!sales) {
      return res.send({
        responseCode: 403,
        responseMessage: "Please enter a correct Email and Password"
      })
    }

    var isValidPassword = await appUtils.verifyPassword({ password: password }, sales);
    if (!isValidPassword) {
      return res.send({
        responseCode: 403,
        responseMessage: "Please enter a correct Email and Password"
      })
    }

    let token = await jwtHandler.genUsrToken({ _id: sales._id, email: sales.emailId, password: sales.password })

    sales.token = token
    await sales.save()

    return res.send({
      responseCode: 200,
      responseMessage: "Success",
      responseData: {
        emailId: sales.emailId,
        username: sales.username,
        apiKey: sales.apiKey,
        token: sales.token
      }
    })


  } catch (err) {
    console.log(err)
    return res.send({
      responseCode: 500,
      responseMessage: "Your request couldn't be processed Please try agaiin!"
    })

  }
}

async function getVolumes(req, res) {
  try {



  } catch (err) {
    console.log(err)
    return res.send({
      responseCode: 500,
      responseMessage: "Your request couldn't be processed Please try agaiin!"
    })

  }
}

async function GetMerchants(req, res) {
  try {
    let merchants = await Sales.findOne({ _id: req.sales._id }).populate({
      path: 'merchants',
      select: 'business_name _id', // Specify the fields you want to include for the merchants
    }).select('merchants').exec();


    return res.send({
      responseCode: 200,
      responseMessage: "Success",
      responseData: merchants
    })
  } catch (err) {
    console.log(err)
    return res.send({
      responseCode: 500,
      responseMessage: "Your request couldn't be processed Please try agaiin!"
    })

  }
}


async function merchantVolume(req, res) {
  try {
    if (req.body.all === false) {
      const merchant_id = req.body.id
      let merchants = await Sales.findOne({ _id: req.sales._id })
        .populate({
          path: 'merchants',
          match: { _id: merchant_id }, // Filter merchants by their _id
          select: 'business_name _id last24hr last24hrSuccess last24hrTotal yesterday yesterdayTransactions successfulTransactions totalTransactions', // Specify the fields you want to include for the merchants
        })
        .select('merchants')
        .exec();


      return res.send({
        responseCode: 200,
        responseMessage: "Success",
        responseData: {
          merchantData: merchants.merchants[0]
        }
      })
    } else {
      // let salesAggregate = await Sales.aggregate([
      //   { $match: { _id: req.sales._id } },
      //   { $unwind: "$merchants" },
      //   {
      //     $group: {
      //       _id: null,
      //       totalLast24hr: { $sum: { $toInt: "$merchants.last24hr" } },
      //       totalLast24hrSuccess: { $sum: { $toInt: "$merchants.last24hrSuccess" } },
      //       totalLast24hrTotal: { $sum: { $toInt: "$merchants.last24hrTotal" } },
      //       totalYesterday: { $sum: { $toInt: "$merchants.yesterday" } },
      //       totalYesterdayTransactions: { $sum: { $toInt: "$merchants.yesterdayTransactions" } },
      //       totalSuccessfulTransactions: { $sum: { $toInt: "$merchants.successfulTransactions" } },
      //       totalTotalTransactions: { $sum: { $toInt: "$merchants.totalTransactions" } }
      //     }
      //   }
      // ]);

      // console.log(salesAggregate)
      // // Extract the totals from the result
      // let totals = {
      //   totalLast24hr: salesAggregate[0].totalLast24hr || 0,
      //   totalLast24hrSuccess: salesAggregate[0].totalLast24hrSuccess || 0,
      //   totalLast24hrTotal: salesAggregate[0].totalLast24hrTotal || 0,
      //   totalYesterday: salesAggregate[0].totalYesterday || 0,
      //   totalYesterdayTransactions: salesAggregate[0].totalYesterdayTransactions || 0,
      //   totalSuccessfulTransactions: salesAggregate[0].totalSuccessfulTransactions || 0,
      //   totalTotalTransactions: salesAggregate[0].totalTotalTransactions || 0
      // };

      // console.log(totals);

      let sales = await Sales.findOne({ _id: req.sales._id })
        .populate({
          path: 'merchants',
          select: 'last24hr last24hrSuccess last24hrTotal yesterday yesterdayTransactions successfulTransactions totalTransactions',
        })
        .select('merchants')
        .exec();

      let total = {
        last24hr: 0,
        last24hrSuccess: 0,
        last24hrTotal: 0,
        yesterday: 0,
        yesterdayTransactions: 0,
        successfulTransactions: 0,
        totalTransactions: 0
      };

      sales.merchants.forEach(merchant => {
        total.last24hr += parseFloat(merchant.last24hr) || 0;
        total.last24hrSuccess += parseFloat(merchant.last24hrSuccess) || 0;
        total.last24hrTotal += parseFloat(merchant.last24hrTotal) || 0;
        total.yesterday += parseFloat(merchant.yesterday) || 0;
        total.yesterdayTransactions += parseFloat(merchant.yesterdayTransactions) || 0;
        total.successfulTransactions += parseFloat(merchant.successfulTransactions) || 0;
        total.totalTransactions += parseFloat(merchant.totalTransactions) || 0;
      });

      return res.send({
        responseCode: 200,
        responseMessage: "SUCCESS",
        responseData: {
          merchantData: {
            ...total
          }

        }
      })

    }

  } catch (err) {
    console.log(err)
    return res.send({
      responseCode: 500,
      responseMessage: "Your request couldn't be processed Please try agaiin!"
    })

  }
}


async function resetPassword(req, res) {
  try {
    const { password, emailId, newPassword } = req.body

    const sales = await Sales.findOne({ _id: req.sales._id }).select('+password');
    if (!sales) {
      return res.send({
        responseCode: 403,
        responseMessage: "Please enter a correct Email and Password"
      })
    }

    var isValidPassword = await appUtils.verifyPassword({ password: password }, sales);

    if (!isValidPassword) {
      res.send({
        responseCode: 404,
        responseMessage: "Old password is incorrect"
      })
    }

    let convertedPass = await appUtils.convertPass(newPassword);

    sales.password = convertedPass
    await sales.save()

    return res.send({
      responseCode: 200,
      responseMessage: "Success"
    })

  } catch (err) {
    console.log(err)
    return res.send({
      responseCode: 500,
      responseMessage: "Your request couldn't be processed Please try agaiin!"
    })

  }
}


async function getProfile(req, res) {
  try {
    let sales = await Sales.findOne({ _id: req.sales._id }).select('username emailId').exec();
    console.log(sales)

    return res.send({
      responseCode: 200,
      responseMessage: "Success",
      responseData: {
        name: sales.username,
        emailId: sales.emailId
      }
    })

  } catch (err) {
    console.log(err)
    return res.send({
      responseCode: 500,
      responseMessage: "Your request couldn't be processed Please try agaiin!"
    })

  }
}






module.exports = {
  Login,
  GetMerchants,
  merchantVolume,
  resetPassword,
  getProfile
}
