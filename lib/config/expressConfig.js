'use strict';

//===============================Load Modules Start========================

const express = require("express"),
    bodyParser = require("body-parser"),//parses information from POST
    methodOverride = require('method-override');//used to manipulate POST
// const morgan = require('morgan');
const session = require('express-session')
const cors = require('cors')
var compression = require('compression');

//const redisServer = require('../redis')
//let RedisStore = redisServer.getRedisStore();
//let redisClient = redisServer.getRedisClient();

module.exports = function (app, env) {

    app.use(cors())
    app.options('*', cors())
   app.use(express.text());
   app.use(bodyParser.urlencoded({ extended: false }));
    app.use(bodyParser.json({
        type(req) {
          return true;
        }
      }))
    // parses application/json bodies
    app.use(express.urlencoded({extended: true }));
    app.use(express.json({ extended: true }));
    // app.use(morgan('combined'));
    // parses application/x-www-form-urlencoded bodies
    // use queryString lib to parse urlencoded bodies
    app.use('/', express.static(process.cwd() + '/public_assets'));
    // app.get('*', (req, res) => {
    //     res.sendFile(process.cwd()+'/public/dist/pluto/index.html');
    //     console.log(`new GET request at : ${req.originalUrl}`);
    // });
    app.use(methodOverride(function (req, res) {
        if (req.body && typeof req.body === 'object' && '_method' in req.body) {
            // look in urlencoded POST bodies and delete it
            var method = req.body._method;
            delete req.body._method;
            return method;
        }
    }));

    app.use(compression());

   
    // app.use('/apiDocs', express.static(app.locals.rootDir + '/api/dist'));
    app.use(function (req, res, next) {
        //res.setHeader('Access-Control-Allow-Origin', req.headers.origin);

        res.header("Access-Control-Allow-Origin", "*");
        res.header('Access-Control-Allow-Credentials', true);
        // res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept,authorization,accessToken," +
        // "lat lng,app_version,platform,ios_version,countryISO,Authorization");
        res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept,authorization,accessToken," +
            "app_version,platform,ios_version,countryISO,Authorization");
        res.setHeader('Access-Control-Allow-Methods', 'POST,GET,PUT,DELETE,OPTIONS');
        next();
    });


   /* app.use(
        session({
          secret: ['veryimportantsecret','notsoimportantsecret','highlyprobablysecret'], 
            name: "secretname", 
            resave: false, 
            saveUninitialized: true,
            cookie: {
                    httpOnly: true,
                    secure: true,
                    sameSite: true,
                    maxAge: 600000 // Time is in miliseconds
            },
            store: new RedisStore({ client: redisClient, ttl: 86400}),   
            resave: false
        }),
    )*/
};
