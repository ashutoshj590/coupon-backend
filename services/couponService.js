var models = require('../models/index.js');
var util = require('../lib/Utils.js');
//var redis = require('../lib/redis.js');
var Q = require('q');
var consts = require('../lib/consts.js');
var aws = require('../lib/aws.js');
var config = consts.parsedConfig;
let userDOA = require('../doa/user');
let commonFuncs = require('../utils/commonFuncs');
let httpError = require('../errors/httpError');
let httpStatusCodes = require('../constants/httpStatusCodes');
var sessionTime = 1 * 60 * 60 * 1000;
let fbServices = require('./fbServices');
let responseConstants = require('../constants/responseConst');
let constants = require('../lib/consts');



/*
*   Function for create coupon .................
*/
exports.createCouponForMerchant = function(user_id,coupon_type,days,start_time,end_time,expiry_date,flash_deal,description,restriction){
    var deferred = Q.defer();
    models.Coupons.create({
        user_id: user_id,
        coupon_type: coupon_type,
        days: days,
        start_time: start_time,
        end_time: end_time,
        expiry_date: expiry_date,
        flash_deal: flash_deal,
        description: description,
        restriction: restriction
      
    }).then(function(couponDetail) {
        deferred.resolve(couponDetail);
    },function(err){
        deferred.reject(err)
    });
    return deferred.promise;
};
