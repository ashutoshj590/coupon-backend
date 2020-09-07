var express = require('express');
var path = require('path');
var app = express();

var Sequelize = require('sequelize');

var bodyParser = require('body-parser');

var session = require('express-session');
var redisStore = require('connect-redis')(session);
var util = require('./lib/Utils.js');

var consts = require('./lib/consts.js');//
var config = util.parsedConfig;
var redisUtil = require('./lib/redis.js');


app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "http://localhost:4200"); // update to match the domain you will make the request from
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
  });
/*
* handlebars configuration
* https://www.packtpub.com/books/content/using-handlebars-express
*/

var exphbs = require('express-handlebars');
const { Session } = require('inspector');
//app.engine('handlebars', exphbs({defaultLayout: 'main', extname: '.handlebars'}));
//app.set('view engine', 'handlebars');

app.engine('.hbs', exphbs({
    defaultLayout: 'main', extname: '.hbs',
    layoutsDir: __dirname + '/views/layouts/'
}
));
app.use("/public", express.static(path.join(__dirname, 'public')));
app.set('view engine', '.hbs');


var options = {
    dotfiles: 'ignore', etag: false,
    extensions: ['htm', 'html'],
    index: false
};



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
    store: new redisStore({host: config.redis.host, port: config.redis.port, client: client, ttl: consts.SESSION_TIME}),
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


/*const post = [
    {
       username: "ashutosh",
       titel: "dsfdsf" 

    },
    {
        username: "asdf",
        titel: "bnm" 
 
     }
]


app.get('/post', authenticateToken, (req, res) => {
    res.json(post.filter(post => post.username === req.user.name));
});

app.post('/login', (req, res) => {
    //Authenticate user
   const username = req.body.username
   const user = { name:username } 
   
   const accessToken = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET)
   res.json({ accessToken: accessToken })

});

function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization']
    const token  = authHeader && authHeader.split('')[1]
    if (token == null) return res.sendStatus(401)

    jwt.verify(token,  process.env.ACCESS_TOKEN_SECRET, (err, user) => {
        if(err) return res.sendStatus(403)
        req.user = user
        next()
    })
} */



var server = app.listen(8080, function () {

    var host = server.address().address;
    var port = server.address().port;

    console.log("Example app listening at http://%s:%s", host, port)

});

//module.exports = app;



