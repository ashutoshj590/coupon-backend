var express = require('express');
var router = express.Router();
var bodyParser = require('body-parser');
var couponService = require('../services/couponService.js');
var util = require('../lib/Utils.js');
var consts = require('../lib/consts.js');
var jsonParser = bodyParser.json({limit: '10mb'});
var sessionTime = 1 * 60 *  60 * 1000;       //1 hour session
const jwt = require('jsonwebtoken');


/* APi For create coupon..................*/

router.post('/create-coupon', [jsonParser, util.hasJsonParam(["user_id","coupon_type","days","start_time","expiry_date",])], function (req, res) {
    couponService.createCouponForMerchant(req.body.user_id,req.body.coupon_type,req.body.days,req.body.start_time,req.body.end_time,req.body.expiry_date,req.body.flash_deal,req.body.description,req.body.restriction,req.body.short_name).then(function (coupon) {
            var response = util.getResponseObject(consts.RESPONSE_SUCCESS);
            response.coupon_detail = coupon;
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


/* APi For update coupon..................*/
router.post('/edit-coupon', [jsonParser, util.hasJsonParam(["user_id","coupon_id"])], function (req, res) {
    couponService.updateCouponForMerchant(req.body.user_id,req.body.coupon_id,req.body.coupon_type,req.body.days,req.body.start_time,req.body.end_time,req.body.expiry_date,req.body.flash_deal,req.body.description,req.body.restriction,req.body.short_name).then(function (coupon) {
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


/* API for mark is_deleted to coupon ................*/

router.post('/delete-coupon',[jsonParser,util.hasJsonParam(["coupon_id"])], function (req, res) { 
couponService.changeStatustoCoupon(req.body.coupon_id).then(function (statusUpdated) {
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

/* API for get all category form database.............*/
router.post('/get-all-coupons',jsonParser, function (req, res) {
    couponService.getAllcoupon().then(function (couponList) {
            var response = util.getResponseObject(consts.RESPONSE_SUCCESS);
            response['coupon_list'] = couponList;
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


/* API for  create request ................*/

router.post('/create-request',[jsonParser,util.hasJsonParam(["consumer_id","merchant_id","sub_category_id","detail","date","time"])], function (req, res) { 
    couponService.addRequestForMerchant(req.body.consumer_id,req.body.merchant_id,req.body.sub_category_id,req.body.detail,req.body.date,req.body.time).then(function (created) {
                var response = util.getResponseObject(consts.RESPONSE_SUCCESS);
                response['request_detail'] = created;
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


    /* API for get request for merchant.............*/
router.post('/get-request-merchant',[jsonParser,util.hasJsonParam(["merchant_id"])], function (req, res) {
    couponService.getAllRequestForMerchant(req.body.merchant_id).then(function (list) {
            var response = util.getResponseObject(consts.RESPONSE_SUCCESS);
            response['request_list'] = list;
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


/* API for mark is_deleted to request ................*/

router.post('/delete-request',[jsonParser,util.hasJsonParam(["request_id"])], function (req, res) { 
    couponService.changeStatustoRequest(req.body.request_id).then(function (statusUpdated) {
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




    /* API for get request for consumer.............*/
router.post('/get-request-consumer',[jsonParser,util.hasJsonParam(["consumer_id"])], function (req, res) {
    couponService.getAllRequestForConsumer(req.body.consumer_id).then(function (list) {
            var response = util.getResponseObject(consts.RESPONSE_SUCCESS);
            response['request_list'] = list;
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


router.post('/get-merchant-by-category',[jsonParser,util.hasJsonParam(["sub_category_id"])], function (req, res) { 
    couponService.getMerchantDetailbySubCateId(req.body.sub_category_id).then(function (detail) {
                var response = util.getResponseObject(consts.RESPONSE_SUCCESS);
               response.merchant_detail = detail;
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


    router.post('/get-coupons-by-id',[jsonParser,util.hasJsonParam(["user_id"])], function (req, res) { 
        couponService.getAllcouponByUserId(req.body.user_id).then(function (detail) {
                    var response = util.getResponseObject(consts.RESPONSE_SUCCESS);
                   response.coupon_detail = detail;
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
    



router.post('/use-coupon',[jsonParser,util.hasJsonParam(["consumer_id","merchant_id","coupon_code","coupon_type"])], function (req, res) { 
    couponService.addUsedCoupontoDatabase(req.body.consumer_id,req.body.merchant_id,req.body.coupon_code,req.body.coupon_type).then(function (used) {
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



router.post('/accept-request',[jsonParser,util.hasJsonParam(["consumer_id","merchant_id","request_id"])], function (req, res) { 
    couponService.acceptRequestFunction(req.body.consumer_id,req.body.merchant_id,req.body.request_id).then(function (accept) {
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

    


router.post('/merchant-reports',[jsonParser,util.hasJsonParam(["merchant_id"])], function (req, res) { 
    couponService.getAllCountsForMerchantCoupons(req.body.merchant_id).then(function (result) {
                var response = util.getResponseObject(consts.RESPONSE_SUCCESS);
                response.Detail = result;
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


router.post('/consumer-reports',[jsonParser,util.hasJsonParam(["consumer_id"])], function (req, res) { 
    couponService.getAllCountsForConsumerCoupons(req.body.consumer_id).then(function (result) {
                var response = util.getResponseObject(consts.RESPONSE_SUCCESS);
                response.Detail = result;
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

    


router.post('/add-to-favourite',[jsonParser,util.hasJsonParam(["consumer_id","merchant_id"])], function (req, res) { 
    couponService.addToFavourite(req.body.consumer_id,req.body.merchant_id).then(function (added) {
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


router.post('/get-favourite-list',[jsonParser,util.hasJsonParam(["consumer_id"])], function (req, res) { 
    couponService.getAllFavouriteMerchaants(req.body.consumer_id).then(function (detail) {
                var response = util.getResponseObject(consts.RESPONSE_SUCCESS);
                response.coupon_detail = detail;
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