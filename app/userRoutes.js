var express = require('express');
var router = express.Router();
var bodyParser = require('body-parser');
var userService = require('../services/UsersService.js');
var util = require('../lib/Utils.js');
var consts = require('../lib/consts.js');
var jsonParser = bodyParser.json({limit: '10mb'});
var sessionTime = 1 * 60 *  60 * 1000;       //1 hour session




/**
 * @api {post} /user/change-password Change password
 * @apiDescription For user to provide change password for authentication.
 */
router.post('/change-password', [jsonParser, util.hasJsonParam(["new_password"]), util.allowedUser(["user","admin","merchant"])], function (req, res) {
    userService.changePasswordForUser(req.session.user_id,req.body.old_password,req.body.new_password,req.session.type).then(function (changePassword) {
            var response = util.getResponseObject(consts.RESPONSE_SUCCESS);
            response.changePassword = changePassword;
            res.send(response);
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

/**
* @api {get} /user/logout Logout
* @apiDescription Logs out the current user and server side session is destroyed.

*/
router.get('/logout', jsonParser, function (req, res) {
    //userService.updateDeviceId(req.session.user_id, null, undefined);
    req.session.destroy(function (err) {
        if (err) {
            console.log(err);
        } else {
                var response = util.getResponseObject(consts.RESPONSE_SUCCESS, "logged out");
                res.send(response);
        }
    });
});



/* API for get all Users...........*/
/*router.get('/get-all-users', jsonParser, function(req, res){
    findUsers(req.body).then(function (allusers) {  
        deferred.resolve(response);
    }, function(err){
        err.response_code !== undefined ? res.send(err) :  res.send(util.getResponseObject(consts.RESPONSE_ERROR, "There was trying to get more Users"));
    });
    res.send(response);
    
}); */



router.post('/register-merchant', [jsonParser, util.hasJsonParam(["user_id","address","city","state","zipcode","opening_time","closing_time","business_name","tagline","website","phone_no","business_license_no","discription","category_id","sub_category_id"])], function (req, res) {
    userService.createMerchantDetail(req.body.user_id,req.body.address,req.body.city,req.body.state,req.body.zipcode,req.body.opening_time,req.body.closing_time,req.body.business_name,req.body.tagline,req.body.website,req.body.phone_no,req.body.business_license_no,req.body.discription,req.body.category_id,req.body.sub_category_id).then(function (detail) {
            var response = util.getResponseObject(consts.RESPONSE_SUCCESS);
            response.detail = detail;
            res.send(response);
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
