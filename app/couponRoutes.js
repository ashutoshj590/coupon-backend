var express = require('express');
var router = express.Router();
var bodyParser = require('body-parser');
var couponService = require('../services/couponService.js');
var util = require('../lib/Utils.js');
var consts = require('../lib/consts.js');
var jsonParser = bodyParser.json({limit: '10mb'});
var sessionTime = 1 * 60 *  60 * 1000;       //1 hour session
const jwt = require('jsonwebtoken');



router.post('/create-coupon', [jsonParser, util.hasJsonParam(["user_id","coupon_type","days","start_time","end_time","expiry_date",])], function (req, res) {
    couponService.createCouponForMerchant(req.body.user_id,req.body.coupon_type,req.body.days,req.body.start_time,req.body.end_time,req.body.expiry_date,req.body.flash_deal,req.body.description,req.body.restriction).then(function (coupon) {
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



module.exports = router;