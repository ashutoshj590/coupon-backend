var express = require('express');
var router = express.Router();
var userService = require('../services/UsersService.js');
var util = require('../lib/Utils.js');
var sessionTime = 1 * 60 * 60 * 1000;       //1 hour session
var consts = require('../lib/consts.js');
var session = require('express-session');
const jwt = require('jsonwebtoken');


/* API funcation for crearte new user sign up..................*/

router.post('/sign-up', [util.hasJsonParam(["email", "password", "type", "device_type"])], function (req, res) {
    var userObject = req.body;
    userService.createNewUser(userObject, req).then(function (response) {
        var response = util.getResponseObject(consts.RESPONSE_SUCCESS);
        res.send(response);
    }, function (err) {
        if(err.errors !== undefined && err.errors[0] !== undefined ){
            var response = util.getResponseObject(consts.RESPONSE_ERROR, err.response);
            res.send(response);
        }else{
            var response = util.getResponseObject(consts.RESPONSE_ERROR, err.response);
        }
        res.send(response);
    }
);
}); 

/* API function for user login who already exist in database.............*/

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


router.post('/login', [util.hasJsonParam(["email", "password", "type", "device_type"])], function (req, res) { 
        var userObject = req.body;
        userService.login(userObject, req.session).then(function (response) {
          var response = util.getResponseObject(consts.RESPONSE_SUCCESS);
          jwt.sign({userObject}, 'secretkey', { expiresIn: '1d'}, (err, token) => {
           var tokenString = token;
          var sessionDetail = {};
          sessionDetail.user_id = req.session.user_id;
          sessionDetail.email = req.session.email;
          sessionDetail.type = req.session.type;
          sessionDetail.device_type = req.session.device_type;
          sessionDetail.is_registered = false;
          if(req.session.is_registered === true){
            sessionDetail.is_registered = true;
          }
          sessionDetail.token = 'Bearer ' + tokenString;
          response['user_Detail'] = sessionDetail;
          res.send(response);
        });

        }, function (err) {
            if(err.errors !== undefined && err.errors[0] !== undefined ){
                var response = util.getResponseObject(consts.RESPONSE_ERROR, err.response);
                res.send(response);
            }else{
                var response = util.getResponseObject(consts.RESPONSE_ERROR, err.response);
            }
            res.send(response);
        }
    );
}); 



  



module.exports = router;
