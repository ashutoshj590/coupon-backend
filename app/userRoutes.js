var express = require('express');
var router = express.Router();
var bodyParser = require('body-parser');
var userService = require('../services/UsersService.js');
var util = require('../lib/Utils.js');
var consts = require('../lib/consts.js');
var jsonParser = bodyParser.json({limit: '10mb'});
var sessionTime = 1 * 60 *  60 * 1000;       //1 hour session
var models = require('../models/index.js');
var fileExtension = require('file-extension')
var multer = require('multer');


var storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'public/images/uploaded_images/')
    },
    filename: function (req, file, cb) {
        cb(null, file.fieldname + '-' + Date.now() + '.' + fileExtension(file.originalname))
    }
})



var upload = multer({
    storage: storage,
    limits: {
        fileSize: 2000000
    },
    fileFilter(req, file, cb) {
        if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
            cb(new Error('Please upload JPG and PNG images only!'))
        }
        cb(undefined, true)
    }
})




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









router.post('/register-merchant', [jsonParser, util.hasJsonParam(["user_id","address","city","state","zipcode","opening_time","closing_time","business_name","tagline","website","phone_no","business_license_no","description","sub_category_id"])], function (req, res) {
    var isEmail;
    if(req.body.notification_email === null){
        isEmail = false;
    } else {
        isEmail = req.body.notification_email;
    }
    userService.createMerchantDetail(req.body.user_id,req.body.address,req.body.city,req.body.state,req.body.zipcode,req.body.opening_time,req.body.closing_time,req.body.business_name,req.body.tagline,req.body.website,req.body.phone_no,req.body.business_license_no,req.body.description,req.body.sub_category_id,isEmail,req.body.lat,req.body.lang).then(function (detail) {
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


router.post('/update-register-merchant', [jsonParser, util.hasJsonParam(["user_id","address","city","state","zipcode","opening_time","closing_time","business_name","tagline","website","phone_no","business_license_no","description","sub_category_id"])], function (req, res) {
    var isEmail;
    if(req.body.notification_email === null){
        isEmail = false;
    } else {
        isEmail = req.body.notification_email;
    }
    userService.updateMerchantDetail(req.body.user_id,req.body.address,req.body.city,req.body.state,req.body.zipcode,req.body.opening_time,req.body.closing_time,req.body.business_name,req.body.tagline,req.body.website,req.body.phone_no,req.body.business_license_no,req.body.description,req.body.sub_category_id,isEmail,req.body.lat,req.body.lang).then(function (detail) {
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
router.post('/uplaod-image',upload.array('images', 5), function (req, res) {
            userService.uploadImageToDatabase(req.body.user_id, req.files, req.body.is_flash_deal, req.body.coupon_id).then(function (result) {
            var response = util.getResponseObject(consts.RESPONSE_SUCCESS);
            userService.getAllImages(req.body.user_id).then(function(data){
                response.imageData = data;
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

/* API for  upload images for merchant registration.............*/
/*router.post('/uplaod-image',upload.array('merchant_image', 5), function(req, res, next){
    var fileinfo = req.files;
    res.send(fileinfo);
}) */





/* API for mark is_deleted to coupon ................*/

router.post('/delete-image',[jsonParser,util.hasJsonParam(["user_id","image_id"])], function (req, res) { 
    userService.deleteImageById(req.body.user_id,req.body.image_id).then(function (result) {
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



router.post('/delete-merchant',[jsonParser,util.hasJsonParam(["user_id"])], function (req, res) { 
    userService.deleteMerchantById(req.body.user_id).then(function (result) {
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


router.post('/delete-consumer',[jsonParser,util.hasJsonParam(["user_id"])], function (req, res) { 
    userService.deleteConsumerById(req.body.user_id).then(function (result) {
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
                   if(response.merchant_detail.notification_email === null){
                       response.merchant_detail.notification_email = false;
                   }
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

       




/* API for give feedback ................*/

router.post('/give-feedback',[jsonParser,util.hasJsonParam(["user_id","feedback"])], function (req, res) { 
    userService.addUserFeedback(req.body.user_id,req.body.feedback).then(function (feedback) {
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


router.post('/get-all-merchant',jsonParser, function (req, res) {
    userService.getAllMerchant().then(function (allmerchant) {
        var response = util.getResponseObject(consts.RESPONSE_SUCCESS);
            response['merchant_list'] = allmerchant;
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




router.post('/get-all-consumer',jsonParser, function (req, res) {
    userService.getAllConsumer().then(function (allconsumer) {
        var response = util.getResponseObject(consts.RESPONSE_SUCCESS);
            response['consumer_list'] = allconsumer;
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


router.post('/get-all-images',[jsonParser,util.hasJsonParam(["merchant_id"])], function (req, res) {
    userService.getAllMerchantImages(req.body.merchant_id).then(function (images) {
        var response = util.getResponseObject(consts.RESPONSE_SUCCESS);
            response.images = images;
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



router.post('/status-update',[jsonParser,util.hasJsonParam(["merchant_id"])], function (req, res) { 
    userService.changeStatustoMerchant(req.body.merchant_id).then(function (result) {
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



router.post('/block-coupon',[jsonParser,util.hasJsonParam(["consumer_id","coupon_id"])], function (req, res) { 
    userService.addToBlock(req.body.consumer_id,req.body.coupon_id).then(function (added) {
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




 
router.post('/get-merchant-detail-admin',[jsonParser,util.hasJsonParam(["user_id"])], function (req, res) {
    userService.getMerchantDetailAdmin(req.body.user_id).then(function (detail) {
                var response = util.getResponseObject(consts.RESPONSE_SUCCESS);
                response.merchant_detail = detail[0];
                if(response.merchant_detail.notification_email === null){
                    response.merchant_detail.notification_email = false;
                }
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
    
    
router.post('/init-token',[jsonParser,util.hasJsonParam(["user_id","device_type","token"])], function (req, res) { 
    userService.addTokenForNotifications(req.body.user_id,req.body.device_type,req.body.token).then(function (added) {
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







module.exports = router;
