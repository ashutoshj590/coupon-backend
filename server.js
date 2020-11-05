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
var passport = require('passport');
require('./services/passport-setup');
var cookieSession = require('cookie-session')


app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "https://www.mccpapp.com"); // http://localhost:4200   //https://www.mccpapp.com
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization"); 
    next();
  });
 


app.use("/public", express.static(path.join(__dirname, 'public')));	



app.use(bodyParser.urlencoded({extended: false}))
app.use(bodyParser.json())

app.use(cookieSession({
    name: 'coupon-session',
    keys: ['key1', 'key2']
  }))

const IsLoggedIn = (req, res, next) => {
    if (req.user) {
        next();
    } else {
        res.sendStatus(401);
    }
} 
  
app.use(passport.initialize());
app.use(passport.session());

app.get('/', (req, res) => res.send('you are not looged in'))
app.get('/failed', (req, res) => res.send('you failed to login'))
app.get('/good', IsLoggedIn,(req, res) => res.send('welcome ashutosh !'))

app.get('/google',passport.authenticate('google', { scope: ['profile','email'] }));

app.get('/google/callback',passport.authenticate('google', { failureRedirect: '/failed' }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect('/good');
  });

app.get('/logout0', (req, res) => {
    req.session = null;
    req.logout();
    res.redirect('/');
})  


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


