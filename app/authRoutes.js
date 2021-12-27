var express = require('express');
var router = express.Router();
var userService = require('../services/UsersService.js');
var util = require('../lib/Utils.js');
var sessionTime = 1 * 60 * 60 * 1000;       //1 hour session
var consts = require('../lib/consts.js');
var session = require('express-session');
const jwt = require('jsonwebtoken');
var bodyParser = require('body-parser');
const passport = require('passport');
var jsonParser = bodyParser.json({limit: '10mb'});
const { response } = require('express');
const nodemailer = require('nodemailer');
var emailConsts = require('../constants/emailConsts');

let transporter = nodemailer.createTransport({
    service: 'yahoo',
    auth: {
        user: process.env.EMAIL,
        pass: process.env.PASSWORD,
        
    },
    tls: {
        rejectUnauthorized:false
    }

});


/* API funcation for crearte new user sign up..................*/

router.post('/sign-up', [util.hasJsonParam(["email", "password", "device_type"])], function (req, res) {
    var userObject = req.body;
    if (userObject.lat == null || undefined){
       userObject.lat = "00.000000";
    }
    if (userObject.lang == null || undefined){
        userObject.lang =  "00.000000";
    }
   
    userService.createNewUser(userObject).then(function (response) {
        var response = util.getResponseObject(consts.RESPONSE_SUCCESS);
        transporter.sendMail(emailConsts.EMAIL__CONSTS.new_consumer, function(err, data) {
            if(err){
               console.log(err);
            } else {
                console.log(data);
            }
        })
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


router.post('/login', [util.hasJsonParam(["email", "password", "device_type"])], function (req, res) { 
        var userObject = req.body;
        userService.login(userObject, req.session).then(function (response) {
          var response = util.getResponseObject(consts.RESPONSE_SUCCESS);
          jwt.sign({userObject}, 'secretkey', { expiresIn: '1d'}, (err, token) => {
           var tokenString = token;
          var sessionDetail = {};
          sessionDetail.user_id = req.session.user_id;
          sessionDetail.email = req.session.email;
          sessionDetail.type = req.session.type;
          sessionDetail.device_type = userObject.device_type;
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


router.post('/forgot-password', [jsonParser, util.hasJsonParam(["email"])], function (req, res) {
        userService.saveOTPForUser(req.body.email).then(function (result) {
            var response = util.getResponseObject(consts.RESPONSE_SUCCESS);
            res.send(response);
        }, function(err){
            if (err.errors !== undefined && err.errors[0] !== undefined) {
                var response = util.getResponseObject(consts.RESPONSE_ERROR, err.errors[0].message);
                res.send(response);
            } else {
                var response = util.getResponseObject(consts.RESPONSE_ERROR, err);
            }
            res.send(response);
        })
});


router.post('/reset-password', [jsonParser, util.hasJsonParam(["otp","new_password","confirm_password"])], function (req, res) {
    userService.changePasswordForUser(req.body.otp,req.body.new_password,req.body.confirm_password).then(function (result) {
        var response = util.getResponseObject(consts.RESPONSE_SUCCESS);
        res.send(response);
    }, function(err){
        if (err.errors !== undefined && err.errors[0] !== undefined) {
            var response = util.getResponseObject(consts.RESPONSE_ERROR, err.errors[0].message);
            res.send(response);
        } else {
            var response = util.getResponseObject(consts.RESPONSE_ERROR, err);
        }
        res.send(response);
    })
});



router.post('/change-password', [jsonParser, util.hasJsonParam(["email","new_password","confirm_password"])], function (req, res) {
    userService.changePasswordForAdmin(req.body.email,req.body.new_password,req.body.confirm_password).then(function (result) {
        var response = util.getResponseObject(consts.RESPONSE_SUCCESS);
        res.send(response);
    }, function(err){
        if (err.errors !== undefined && err.errors[0] !== undefined) {
            var response = util.getResponseObject(consts.RESPONSE_ERROR, err.errors[0].message);
            res.send(response);
        } else {
            var response = util.getResponseObject(consts.RESPONSE_ERROR, err);
        }
        res.send(response);
    })
});




router.post('/google-login', [util.hasJsonParam(["device_type","login_type","google_id"])], function (req, res) { 
    var userObject = req.body;
    if (userObject.lat == null || undefined){
        userObject.lat = "00.000000";
     }
     if (userObject.lang == null || undefined){
         userObject.lang =  "00.000000";
     }
    userService.googleLogin(userObject).then(function (data) {
      var response = util.getResponseObject(consts.RESPONSE_SUCCESS);
      jwt.sign({userObject}, 'secretkey', { expiresIn: '1d'}, (err, token) => {
       var tokenString = token;
      var sessionDetail = {};
      sessionDetail.user_id = data.id;
      sessionDetail.type = data.type;
      sessionDetail.device_type = data.device_type;
      sessionDetail.is_registered = false;
      if(data.is_registered === true){
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


router.post('/facebook-login', [util.hasJsonParam(["device_type","login_type","fb_id"])], function (req, res) { 
    var userObject = req.body;
    if (userObject.lat == null || undefined){
        userObject.lat = "00.000000";
     }
     if (userObject.lang == null || undefined){
         userObject.lang =  "00.000000";
     }
    userService.facebookLogin(userObject).then(function (data) {
      var response = util.getResponseObject(consts.RESPONSE_SUCCESS);
      jwt.sign({userObject}, 'secretkey', { expiresIn: '1d'}, (err, token) => {
       var tokenString = token;
      var sessionDetail = {};
      sessionDetail.user_id = data.id;
      sessionDetail.type = data.type;
      sessionDetail.device_type = data.device_type;
      sessionDetail.is_registered = false;
      if(data.is_registered === true){
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
