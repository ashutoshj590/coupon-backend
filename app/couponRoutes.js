var express = require('express');
var router = express.Router();
var bodyParser = require('body-parser');
var couponService = require('../services/couponService.js');
var util = require('../lib/Utils.js');
var consts = require('../lib/consts.js');
var jsonParser = bodyParser.json({limit: '10mb'});
var sessionTime = 1 * 60 *  60 * 1000;       //1 hour session
const jwt = require('jsonwebtoken');
var async = require('async');
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


/* APi For create coupon..................*/

router.post('/create-coupon', [jsonParser, util.hasJsonParam(["user_id","sub_cate_id","coupon_type","days","start_time","end_time","expiry_date",])], function (req, res) {
    couponService.createCouponForMerchant(req.body.user_id,req.body.sub_cate_id,req.body.coupon_type,req.body.days,req.body.start_time,req.body.end_time,req.body.expiry_date,req.body.flash_deal,req.body.description,req.body.restriction,req.body.consumer_id).then(function (coupon) {
            var response = util.getResponseObject(consts.RESPONSE_SUCCESS);
            response.coupon_detail = coupon;
            emailConsts.EMAIL__CONSTS.create_coupon.text = coupon;
            transporter.sendMail(emailConsts.EMAIL__CONSTS.create_coupon, function(err, data) {
                if(err){
                   console.log(err);
                } else {
                    console.log(data);
                }
            })
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
router.post('/accept-edit-coupon', [jsonParser, util.hasJsonParam(["consumer_id","request_id","user_id","coupon_id"])], function (req, res) {
    couponService.updateCouponForMerchant(req.body.consumer_id,req.body.request_id,req.body.user_id,req.body.sub_cate_id,req.body.coupon_id,req.body.coupon_type,req.body.days,req.body.start_time,req.body.end_time,req.body.expiry_date,req.body.flash_deal,req.body.description,req.body.restriction,"accept").then(function (coupon) {
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


/* APi For update coupon..................*/
router.post('/edit-coupon', [jsonParser, util.hasJsonParam(["user_id","coupon_id"])], function (req, res) {
    couponService.updateCouponForMerchant(null,null,req.body.user_id,req.body.sub_cate_id,req.body.coupon_id,req.body.coupon_type,req.body.days,req.body.start_time,req.body.end_time,req.body.expiry_date,req.body.flash_deal,req.body.description,req.body.restriction,req.body.status).then(function (coupon) {
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

/* APi For update  custom coupon..................*/
router.post('/edit-custom-coupon', [jsonParser, util.hasJsonParam(["user_id","coupon_id"])], function (req, res) {
    couponService.updateCustomCouponForMerchant(req.body.user_id,req.body.coupon_id,req.body.days,req.body.start_time,req.body.end_time,req.body.expiry_date,req.body.flash_deal,req.body.description,req.body.restriction).then(function (coupon) {
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
            transporter.sendMail(emailConsts.EMAIL__CONSTS.delete_coupon, function(err, data) {
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


router.post('/get-all-coupons',jsonParser, function (req, res) {
    if(req.body.merchant_id == null || undefined){
       var merchantId = null;
    } else {
       var merchantId = req.body.merchant_id;
    }
    couponService.getAllcoupon(merchantId).then(function (couponList) {
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



router.post('/get-all-coupons-admin',jsonParser, function (req, res) {
    couponService.getAllcouponAdmin().then(function (couponList) {
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


router.post('/get-all-request',jsonParser, function (req, res) {
    couponService.getAllReq().then(function (couponList) {
            var response = util.getResponseObject(consts.RESPONSE_SUCCESS);
            response['request_list'] = couponList.reverse();
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

router.post('/create-request',[jsonParser,util.hasJsonParam(["consumer_id","sub_category_id","detail","date","time"])], function (req, res) { 
    couponService.addRequestForMerchant(req.body.consumer_id,req.body.sub_category_id,req.body.detail,req.body.date,req.body.time).then(function (created) {
                var response = util.getResponseObject(consts.RESPONSE_SUCCESS);
                response['request_detail'] = created;
                transporter.sendMail(emailConsts.EMAIL__CONSTS.create_request, function(err, data) {
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
                transporter.sendMail(emailConsts.EMAIL__CONSTS.delete_request, function(err, data) {
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




    /* API for get request for consumer.............*/
router.post('/get-request-consumer',[jsonParser,util.hasJsonParam(["consumer_id"])], function (req, res) {
    couponService.getAllRequestForConsumer(req.body.consumer_id).then(function (list) {
            var response = util.getResponseObject(consts.RESPONSE_SUCCESS);
            list.forEach(function(obj, index) {
                if(obj.is_accepted == 1){
                    obj.is_accepted = true;
                } else {
                    obj.is_accepted = false;
                }
            })
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

    /* API for get all merchant by key search and under 10 km radius .............*/
  /*  router.post('/get-search-merchant',[jsonParser,util.hasJsonParam(["search_query"])], function (req, res) {
        var consumerId;
        if (req.body.consumer_id){
            consumerId = req.body.consumer_id;

        } else {
            consumerId = null;
        }
        couponService.getAllmerchantBySerach(req.body.search_query, consumerId).then(function (list) {
           if (req.body.search_query == ""){
               list = "";
            }
                var response = util.getResponseObject(consts.RESPONSE_SUCCESS);
                var output = [];
                async.eachSeries(list,function(data,callback){ 
                 data.is_fav = false;
                 couponService.findFavMerchant(consumerId, data.user_id).then(function(foundData){
                    if (foundData != null || undefined){
                        if (foundData.consumer_id == consumerId && foundData.merchant_id == data.user_id && foundData.is_fav == 1) {
                            data.is_fav = true;
                           
                        } else if (foundData.consumer_id == consumerId && foundData.merchant_id == data.user_id && foundData.is_fav == 0) {
                            data.is_fav = false;
                           
                        }
                    }
                    output.push(data);
                    callback();
               }, function(err){
                   deferred.reject(err);
               })
                
        
            }, function(err, list) {
                response.merchant_list = output;
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
    }); */



router.post('/get-search-merchant',[jsonParser,util.hasJsonParam(["search_query"])], function (req, res) {
    if(req.body.consumer_id == null || undefined){
        var consumerId = null;
     } else {
        var consumerId = req.body.consumer_id;
     } 
    couponService.getCouponsBySerach(req.body.search_query, consumerId).then(function (result) {
                var response = util.getResponseObject(consts.RESPONSE_SUCCESS);
                response.search_detail = result;
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



router.post('/get-merchant-by-category',[jsonParser,util.hasJsonParam(["lat1","lon1"])], function (req, res) {
    var consumerId;
    var merchantId;
    var subCateId;
   
    var dist;
    if (req.body.consumer_id){
        consumerId = req.body.consumer_id;
    } else {
        consumerId = null;
    }
    if (req.body.merchant_id){
        merchantId = req.body.merchant_id;
    } else {
        merchantId = null;
    }
    if (req.body.distance){
        dist = req.body.distance;
    } else {
        dist = null;
    }
    if (req.body.sub_category_id){
        subCateId = req.body.sub_category_id;
    } else {
        subCateId = null;
    }
    couponService.getMerchantDetailbySubCateId(subCateId, consumerId, req.body.lat1, req.body.lon1, merchantId, dist).then(function (detail) {
        var response = util.getResponseObject(consts.RESPONSE_SUCCESS);
        var arr = [];
        detail.forEach(function(obj, index) {
        if (obj.couponDetail.length != 0){
            arr.push(obj);
        }
       
        })
        response.merchant_detail = arr;
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




    


router.post('/get-coupons-by-id',[jsonParser,util.hasJsonParam(["merchant_id","consumer_id"])], function (req, res) { 
couponService.getAllcouponByUserId(req.body.merchant_id, req.body.consumer_id).then(function (detail) {
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



router.post('/get-custom-coupons',[jsonParser,util.hasJsonParam(["consumer_id"])], function (req, res) { 
    couponService.getAllCustomCuponsForConsumer(req.body.consumer_id).then(function (detail) {
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



router.post('/use-coupon',[jsonParser,util.hasJsonParam(["consumer_id","merchant_id","coupon_code","coupon_type","lat","lang"])], function (req, res) { 
    couponService.addUsedCoupontoDatabase(req.body.consumer_id,req.body.merchant_id,req.body.coupon_code,req.body.coupon_type,req.body.lat,req.body.lang).then(function (used) {
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



router.post('/reject-request',[jsonParser,util.hasJsonParam(["consumer_id","merchant_id","request_id","coupon_id"])], function (req, res) { 
    couponService.acceptRequestFunction(req.body.consumer_id, req.body.merchant_id, req.body.request_id, 0).then(function (reject) {
        couponService.updateCouponForMerchant(req.body.consumer_id,null,req.body.merchant_id,req.body.coupon_id,null,"custom",null,null,null,null,null,null,null,null,"reject").then(function (reject) {
                var response = util.getResponseObject(consts.RESPONSE_SUCCESS);
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


router.post('/fav-unfav-coupon',[jsonParser,util.hasJsonParam(["consumer_id","merchant_id","coupon_id"])], function (req, res) { 
    couponService.addToFavouriteCoupon(req.body.consumer_id,req.body.merchant_id,req.body.coupon_id).then(function (added) {
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
    couponService.getAllFavouriteMerchants(req.body.consumer_id).then(function (detail) {
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


router.post('/get-favourite-coupons',[jsonParser,util.hasJsonParam(["consumer_id"])], function (req, res) {
    var subCateId; 
    if (req.body.sub_category_id){
        subCateId = req.body.sub_category_id;
    } else {
        subCateId = null;
    } 
    couponService.getAllFavouriteCoupons(req.body.consumer_id,subCateId).then(function (detail) {
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



router.post('/get-used-coupons',[jsonParser,util.hasJsonParam(["consumer_id"])], function (req, res) { 
    couponService.getAllUsedCoupons(req.body.consumer_id).then(function (detail) {
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


router.post('/get-coupon-detail',[jsonParser,util.hasJsonParam(["coupon_id"])], function (req, res) { 
    couponService.getCouponDetail(req.body.coupon_id).then(function (detail) {
                var response = util.getResponseObject(consts.RESPONSE_SUCCESS);
                response.coupon_detail = detail[0];
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




router.post('/get-coupon-detail-admin',[jsonParser,util.hasJsonParam(["coupon_id"])], function (req, res) { 
    couponService.getCouponDetailAdmin(req.body.coupon_id).then(function (detail) {
                var response = util.getResponseObject(consts.RESPONSE_SUCCESS);
                response.coupon_detail = detail[0];
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




router.post('/get-coupons-admin',[jsonParser,util.hasJsonParam(["merchant_id"])], function (req, res) { 
    couponService.getAllcouponByMerchantId(req.body.merchant_id).then(function (detail) {
                var response = util.getResponseObject(consts.RESPONSE_SUCCESS);
                var data = [];
                detail.forEach(function(coupon, index){
                    if (coupon.days == null){
                        coupon.days = "NA";
                    }
                   if (coupon.start_time == null){
                        coupon.start_time = "NA";
                    }
                   if (coupon.end_time == null){
                        coupon.end_time = "NA";
                    }
                   if (coupon.expiry_date == null){
                        coupon.expiry_date = "NA";
                    }
                   if (coupon.flash_deal == null){
                        coupon.flash_deal = "NA";
                    }
                  if (coupon.description == null){
                        coupon.description = "NA";
                    }
                   if (coupon.restriction == null){
                        coupon.restriction = "NA";
                    }
                    data.push(coupon);  
                })
                response.coupon_detail = data;
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



router.post('/get-coupons-consumer',[jsonParser,util.hasJsonParam(["consumer_id"])], function (req, res) { 
    couponService.getAllcouponByConsumerId(req.body.consumer_id).then(function (detail) {
                var response = util.getResponseObject(consts.RESPONSE_SUCCESS);
                var data = [];
                detail.forEach(function(coupon, index){
                    if (coupon.days == null){
                        coupon.days = "NA";
                    }
                   if (coupon.start_time == null){
                        coupon.start_time = "NA";
                    }
                   if (coupon.end_time == null){
                        coupon.end_time = "NA";
                    }
                   if (coupon.expiry_date == null){
                        coupon.expiry_date = "NA";
                    }
                   if (coupon.flash_deal == null){
                        coupon.flash_deal = "NA";
                    }
                  if (coupon.description == null){
                        coupon.description = "NA";
                    }
                   if (coupon.restriction == null){
                        coupon.restriction = "NA";
                    }
                    data.push(coupon);  
                })
                response.coupon_detail = data;
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



router.post('/allow-request-admin',[jsonParser,util.hasJsonParam(["request_id"])], function (req, res) { 
    couponService.allowRequest(req.body.request_id).then(function (result) {
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



router.post('/reject-request-admin',[jsonParser,util.hasJsonParam(["request_id"])], function (req, res) { 
    couponService.rejectRequest(req.body.request_id).then(function (result) {
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