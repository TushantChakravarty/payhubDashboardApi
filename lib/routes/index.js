// Load user routes
const usrRouter = require('../routesAndServices/user/userRoute')
const adminRouter = require('../routesAndServices/admin/adminRoute')
const reportsRouter = require('../routesAndServices/reports/reportsRoute')
const supportRouter = require('../routesAndServices/support/supportRoutes')
const callbackRouter = require('../routesAndServices/callbacks/callbackRoutes')
const payoutsRouter = require('../routesAndServices/payouts/payoutRoutes')
const userPayoutsRouter = require('../routesAndServices/payouts/userPayouts/userPayoutRoutes')
const salesRouter = require("../routesAndServices/sales/salesRoute")
const appUtils = require("../appUtils")

//========================== Load Modules End ==============================================

//========================== Export Module Start ====== ========================

module.exports = function (app) {
    app.get("/", (req, res) => {
        res.status(200).send("ok 1");
    })
    // app.use('/user',appUtils.checkIpWhitelist, usrRouter)
    // app.use('/admin',appUtils.checkIpWhitelist, adminRouter)
    // app.use('/admin/reports',appUtils.checkIpWhitelist, reportsRouter)
    // app.use('/support',appUtils.checkIpWhitelist, supportRouter)
    // app.use('/callback', callbackRouter)
    // app.use('/payouts',appUtils.checkIpWhitelist, payoutsRouter)
    // app.use('/sales',appUtils.checkIpWhitelist, salesRouter)
    // app.use('/user/payouts',appUtils.checkIpWhitelist, userPayoutsRouter)
    app.use('/user',appUtils.checkIpWhitelist, usrRouter)
    app.use('/admin',appUtils.checkIpWhitelist, adminRouter)
    app.use('/admin/reports',appUtils.checkIpWhitelist, reportsRouter)
    app.use('/support',appUtils.checkIpWhitelist, supportRouter)
    app.use('/callback', callbackRouter)
    app.use('/payouts',appUtils.checkIpWhitelist, payoutsRouter)
    app.use('/sales',appUtils.checkIpWhitelist, salesRouter)
    app.use('/user/payouts',appUtils.checkIpWhitelist, userPayoutsRouter)


};
