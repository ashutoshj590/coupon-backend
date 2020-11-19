var express = require('express');
var path = require('path');
var app = express();
var cookieParser = require('cookie-parser');
var Sequelize = require('sequelize');
var morgan = require('morgan');
var bodyParser = require('body-parser');
var passport = require('passport');
var session = require('express-session');
var redisStore = require('connect-redis')(session);
var util = require('./lib/Utils.js');
var flash = require('connect-flash');
var consts = require('./lib/consts.js');//
var config = util.parsedConfig;
var redisUtil = require('./lib/redis.js');
var cors = require('cors');
app.use(cors())
var https = require('https');
var fs = require('fs');
var admin = require("firebase-admin");
var serviceAccount = require("./certs/coupon-app-293511-firebase-adminsdk-qig61-26c962f44d.json");

app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "https://www.mccpapp.com"); // http://localhost:4200   //https://www.mccpapp.com
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization"); 
    next();
  });
 

  
app.use("/public", express.static(path.join(__dirname, 'public')));	



app.use(bodyParser.urlencoded({extended: false}))
app.use(bodyParser.json())

/*admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://coupon-app-293511.firebaseio.com"
  });
 
  
var token = [''];  

var payload = {
    notification: {
        title: "This is a notification",
        body: "This is the body of the notification message"
    }
};

var options = {
    priority: "high",
    timeToLive: 60 * 60 * 24
};

admin.messaging().sendToDevice(token, payload, options)
.then(function(response){
    console.log("Successfully sent message:", response);
})
.catch(function(error){
    console.log("Error sending message:", error);
}); */


var sequelize = new Sequelize(config.database.db_name, config.database.db_user, config.database.db_pass, {
    host: config.database.hostname,
    dialect: 'mysql',

    pool: {
        max: 10,
        min: 0,
        idle: 10000
    },

});

sequelize
    .authenticate()
    .then(function (err) {
        console.log('Connection has been established successfully.');
    })
    .catch(function (err) {
        console.log('Unable to connect to the database:', err);
    }
    );
    
 // create application/json parser
 var jsonParser = bodyParser.json({limit: '10mb'});

 // create application/x-www-form-urlencoded parser
 app.use(bodyParser.json({limit: '10mb', extended: true}));

 
 var client = redisUtil.connection;


/*
    * Setting up of redis session store
    */
app.use(session({
    secret: config.secrets.salt,    //Session will be encrypted using this value.
    // create new redis store.
    store: new redisStore({host: config.redis.host, port: config.redis.port, client: client, ttl: consts.SESSION_TIME}), //
    saveUninitialized: false,       //session will not be saved in first response itself (without values)
    resave: false,                  //won't be stored in session store if session is not modified
    rolling: true,                   //expiration is reset on every response
    cookie: {maxAge: consts.SESSION_TIME}
})); 


/*
 * Authenticate each request, except login and sign-up
 * hard coded password for API doc
 */
/*app.use(function (req, res, next) {
    var reqPath = req.path;
    if (util.checkSession(req) || consts.EXEMPTED_ROUTES.indexOf(reqPath) !== -1) {
        next();
    }
    else {
        res.send(util.getResponseObject(consts.RESPONSE_SESSION_EXPIRED, "Session Expired. Please login again."));
    }
}); */


//app.use('/api/documentation', express.static(__dirname + '/public/apidoc'));




app.use("/auth", require('./app/authRoutes'));
app.use("/user", require('./app/userRoutes'));
app.use("/category", require('./app/categoryRoutes.js'));
app.use("/coupon", require('./app/couponRoutes.js'));


var sslSever = https.createServer(
   {
       key: fs.readFileSync(path.join(__dirname, 'certs', 'mccpapp-new.key')),
       cert: fs.readFileSync(path.join(__dirname, 'certs', 'e7018f498e740284.crt')),
       ca: fs.readFileSync(path.join(__dirname, 'certs', 'gd_bundle-g2-g1.crt'))
   } ,
   app
)

sslSever.listen(8080, () => console.log("Secure server on port 8080"))



/*var server = app.listen(8080, function () {

    var host = server.address().address;
    var port = server.address().port;

    console.log("Example app listening at http://%s:%s", host, port)

}); */
//module.exports = app;


