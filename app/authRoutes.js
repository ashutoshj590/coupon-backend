var express = require('express');
var router = express.Router();
var userService = require('../services/UsersService.js');
var util = require('../lib/Utils.js');
var sessionTime = 1 * 60 * 60 * 1000;       //1 hour session
var consts = require('../lib/consts.js');
var session = require('express-session');

/*var app = express();
require('dotenv').config()
const jwt = require('jsonwebtoken');
app.use(express.json()); */




/* API function for new user sign up...................*/


router.post('/sign-up', [util.hasJsonParam(["email", "password", "type"])], function (req, res) {
    var userObject = req.body;
    userService.createNewUser(userObject, req).then((user) => {
        util.refreshSession(req, user, sessionTime);
        util.sendResponse(user, req, res);
    }, (err) => {
        util.sendError(err, req, res);
    });
});

/* API fucntion for user login who already exist in database.............*/

/*
router.post('/login', [util.hasJsonParam(["email", "password", "type"])], function (req, res) { 
    var userObject = req.body;
    console.log("req.session checking at first level........");
    console.log(req.session);
    userService.login(userObject, req.session).then((response) => {
        util.sendResponse(response, req, res);
        response['access_token'] = req.session;
        res.send(response);
        console.log("Response.......");
        console.log(response);
    }, (err) => {
        util.sendError(err, req, res);
    });
}); */

router.post('/login', [util.hasJsonParam(["email", "password", "type"])], function (req, res) { 
        var userObject = req.body;
        userService.login(userObject, req.session).then(function (response) {
            var response = util.getResponseObject(consts.RESPONSE_SUCCESS);
           // const accessToken = jwt.sign(userObject, process.env.ACCESS_TOKEN_SECRET)
          //  response['access_token'] = accessToken;
            res.send(response);
            console.log("response========");
            console.log(response);
        }, function (err) {
            if(err.errors !== undefined && err.errors[0] !== undefined ){
                var response = util.getResponseObject(consts.RESPONSE_ERROR, err.errors[0].message);
                res.send(response);
            }else{
                var response = util.getResponseObject(consts.RESPONSE_ERROR, err);
            }
            res.send(response);
        }
    );
}); 







module.exports = router;
