var express = require('express');
var router = express.Router();
var bodyParser = require('body-parser');
var userService = require('../services/UsersService.js');
var util = require('../lib/Utils.js');
var consts = require('../lib/consts.js');
var jsonParser = bodyParser.json({limit: '10mb'});
var sessionTime = 1 * 60 *  60 * 1000;       //1 hour session
var models = require('../models/index.js');
const crypto = require('crypto');
const nodemailer = require('nodemailer')
const sendgridTransport = require('nodemailer-sendgrid-transport')

const transporter = nodemailer.createTransport(sendgridTransport({
    auth:{
        api_key:"BD.couponApp-123"
    }

}))



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



router.post('/register-merchant', [jsonParser, util.hasJsonParam(["user_id","address","city","state","zipcode","opening_time","closing_time","business_name","tagline","website","phone_no","business_license_no","discription","sub_category_id"])], function (req, res) {
    userService.createMerchantDetail(req.body.user_id,req.body.address,req.body.city,req.body.state,req.body.zipcode,req.body.opening_time,req.body.closing_time,req.body.business_name,req.body.tagline,req.body.website,req.body.phone_no,req.body.business_license_no,req.body.discription,req.body.sub_category_id).then(function (detail) {
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


router.post('/update-register-merchant', [jsonParser, util.hasJsonParam(["user_id","address","city","state","zipcode","opening_time","closing_time","business_name","tagline","website","phone_no","business_license_no","discription","sub_category_id"])], function (req, res) {
    userService.updateMerchantDetail(req.body.user_id,req.body.address,req.body.city,req.body.state,req.body.zipcode,req.body.opening_time,req.body.closing_time,req.body.business_name,req.body.tagline,req.body.website,req.body.phone_no,req.body.business_license_no,req.body.discription,req.body.sub_category_id).then(function (detail) {
            var response = util.getResponseObject(consts.RESPONSE_SUCCESS);
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


/* API for  upload images for merchant registration.............*/
router.post('/uplaod-image', [jsonParser, util.hasJsonParam(["user_id","images"])], function (req, res) {
    userService.uploadImageToDatabase(req.body.user_id, req.body.images);
            var response = util.getResponseObject(consts.RESPONSE_SUCCESS);
            response.user_id = req.body.user_id;
            response.images = req.body.images;
            res.send(response);
        if (err) {
            if(err.errors !== undefined && err.errors[0] !== undefined ){
                var response = util.getResponseObject(consts.RESPONSE_ERROR, err.response);
                res.send(response);
            }else{
                var response = util.getResponseObject(consts.RESPONSE_ERROR, err.response);
            }
            res.send(response);
        }
      
        
}); 


/* API for mark is_deleted to coupon ................*/

router.post('/delete-image',[jsonParser,util.hasJsonParam(["user_id","image_id"])], function (req, res) { 
    userService.changeStatustoImg(req.body.user_id,req.body.image_id).then(function (statusUpdated) {
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


    router.post('/get-merchant-detail',[jsonParser,util.hasJsonParam(["user_id"])], function (req, res) { 
        userService.getMerchantDetail(req.body.user_id).then(function (detail) {
                    var response = util.getResponseObject(consts.RESPONSE_SUCCESS);
                   response.merchant_detail = detail[0];
                   
                   userService.getAllImages(req.body.user_id).then(function(data){
                    response.merchant_detail.imageData = data;
                    res.send(response);
                }, function(err){
                    var response = util.getResponseObject(consts.RESPONSE_ERROR, err);
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


/* API for forgot password..............*/
router.post('/forgot-password', (req, res)=>{
    crypto.randomBytes(32,(err,Buffer)=>{
        if(err){
            console.log(err);
        }
        const token = Buffer.toString("hex")
        models.Users.findOne({email: req.body.email})
        .then(user=>{
            if(!user){
                return res.status(422).json({error:"User dont exists with that email"})
            }
            user.resetToken = token
            user.expireToken = Date.now() + 3600000
            user.save().then((result)=>{
                transporter.sendMail({
                    to:user.email,
                    from:"no-reply@db.com",
                    subject:"password reset",
                    html:`
                    <p>You requested for password reset</p>
                    <h5>click in this <a href="http://localhost:8080/reset/${token}">link</a> to reset password</h5>
                    `
                })
                res.json({message:"check your email"})
            })
        })

    })
})






module.exports = router;
