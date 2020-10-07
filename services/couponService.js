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
exports.createCouponForMerchant = function(user_id,coupon_type,days,start_time,end_time,expiry_date,flash_deal,description,restriction, shortName){
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
        restriction: restriction,
        is_deleted: 0,
        is_fav: 0,
        short_name: shortName
    }).then(function(couponDetail) {
        deferred.resolve(couponDetail);
    },function(err){
        deferred.reject(err)
    });
    return deferred.promise;
};

/*
*   Function for Update coupon .................
*/
exports.updateCouponForMerchant = function(user_id,coupon_id,coupon_type,days,start_time,end_time,expiry_date,flash_deal,description,restriction,shortName){
    var deferred = Q.defer();
    models.Coupons.update({
        coupon_type: coupon_type,
        days: days,
        start_time: start_time,
        end_time: end_time,
        expiry_date: expiry_date,
        flash_deal: flash_deal,
        description: description,
        restriction: restriction,
        short_name: shortName
     } ,  {
            where:{
                id: coupon_id,
                user_id: user_id
            }
    }).then(function(couponUpdate) {
        deferred.resolve(couponUpdate);
    },function(err){
        deferred.reject(err)
    });
    return deferred.promise;
};


/*
* Function for change status to coupon
*/
exports.changeStatustoCoupon = function(coupon_id){
    var deferred = Q.defer();
        models.Coupons.update({
            is_deleted: 1
        },{
            where: {
            id: coupon_id
            }
        }).then(function(statusUpdated){
            deferred.resolve(statusUpdated);
        },
        function (err) {
            deferred.reject(err);
        }
    );
    return deferred.promise;

};

/*
* Fuction define for get All coupon list from database.
*/
exports.getAllcoupon = function(){
    var deferred = Q.defer();
    var cond={"is_deleted":0};
    models.Coupons.findAll({
      where: cond
    }).then(function (allCoupons) {
            deferred.resolve(allCoupons);
        },function (err) {
          deferred.reject(err);
        }
    );
    return deferred.promise;
};


/*
*   Function for create request .................
*/
exports.addRequestForMerchant = function(consumer_id, merchant_id, sub_category_id, detail, date, time){
    var deferred = Q.defer();
    models.Requests.create({
        consumer_id: consumer_id,
        merchant_id: merchant_id,
        sub_category_id: sub_category_id,
        detail: detail,
        date: date,
        time: time,
        is_deleted: 0
        
    }).then(function(requestDetail) {
        deferred.resolve(requestDetail);
    },function(err){
        deferred.reject(err)
    });
    return deferred.promise;
};



/*
* Fuction define for get All request list from database for merchant
*/
exports.getAllRequestForMerchant = function(merchant_id){
    var deferred = Q.defer();
    var cond={"is_deleted":0,
                "merchant_id": merchant_id
     };
    models.Requests.findAll({
      where: cond
    }).then(function (allRequest) {
            deferred.resolve(allRequest);
        },function (err) {
          deferred.reject(err);
        }
    );
    return deferred.promise;
};



/*
* Function for change status to coupon
*/
exports.changeStatustoRequest = function(request_id){
    var deferred = Q.defer();
        models.Requests.update({
            is_deleted: 1
        },{
            where: {
            id: request_id
            }
        }).then(function(statusUpdated){
            deferred.resolve(statusUpdated);
        },
        function (err) {
            deferred.reject(err);
        }
    );
    return deferred.promise;

};


/*
* Fuction define for get All request list from database for consumer
*/
exports.getAllRequestForConsumer = function(consumer_id){
    var deferred = Q.defer();
    var cond={"is_deleted":0,
                "consumer_id": consumer_id
     };
    models.Requests.findAll({
      where: cond
    }).then(function (allRequest) {
            deferred.resolve(allRequest);
        },function (err) {
          deferred.reject(err);
        }
    );
    return deferred.promise;
};


exports.getMerchantDetailbySubCateId = function(sub_category_id){
    var deferred = Q.defer();
    var replacements = {sub_category_id : sub_category_id};
    var query = 'select Registrations.user_id as user_id, Registrations.address,Registrations.city,Registrations.state,Registrations.zipcode,Registrations.business_name,Registrations.tagline,Registrations.website,' +
                ' Registrations.phone_no,Registrations.business_license_no,Registrations.description,Registrations.opening_time,Registrations.closing_time, UploadImgs.image' +
                ' from UserSubCateMaps LEFT JOIN Registrations ON Registrations.user_id=UserSubCateMaps.user_id LEFT JOIN (SELECT * FROM UploadImgs WHERE UploadImgs.user_id = UploadImgs.user_id LIMIT 1) UploadImgs ON UploadImgs.user_id=UserSubCateMaps.user_id WHERE UserSubCateMaps.sub_category_id=:sub_category_id;'
    models.sequelize.query(query,
        { replacements: replacements, type: models.sequelize.QueryTypes.SELECT }
    ).then(function(result) {
        deferred.resolve(result);

        }
    );
    return deferred.promise;
};


//"select * from UserSubCateMaps LEFT JOIN Registrations ON Registrations.user_id=UserSubCateMaps.user_id where UserSubCateMaps.sub_category_id=1;"

exports.getAllcouponByUserId = function(user_id){
    var deferred = Q.defer();
    var cond={"is_deleted":0,
                "user_id": user_id
};
    models.Coupons.findAll({
      where: cond
    }).then(function (allCoupons) {
        deferred.resolve(allCoupons);
        },function (err) {
          deferred.reject(err);
        }
    );
    return deferred.promise;
};


var findUsedCoupons = function(merchant_id, coupon_id){
    var deferred = Q.defer();
    var cond={
                "merchant_id": merchant_id,
                "coupon_id": coupon_id
    };
    models.UsedCoupons.findAll({
      where: cond
    }).then(function (result) {
            deferred.resolve(result);
        },function (err) {
          deferred.reject(err);
        }
    );
    return deferred.promise;
};



exports.addUsedCoupontoDatabase = function(consumer_id, merchant_id, coupon_id, coupon_type){
    var deferred = Q.defer();
    models.UsedCoupons.create({
        consumer_id: consumer_id,
        merchant_id: merchant_id,
        coupon_id: coupon_id,
        coupon_type: coupon_type,
        
    }).then(function(couponUsed) {
        deferred.resolve(couponUsed);
    },function(err){
        deferred.reject(err)
    });
    return deferred.promise;
};


exports.acceptRequestFunction = function(consumer_id, merchant_id, request_id){
    var deferred = Q.defer();
    models.AcceptRequest.create({
        consumer_id: consumer_id,
        merchant_id: merchant_id,
        request_id: request_id
        
    }).then(function(requestAccpeted) {
        deferred.resolve(requestAccpeted);
    },function(err){
        deferred.reject(err)
    });
    return deferred.promise;
};



exports.getAllCountsForMerchantCoupons = function(merchant_id){
    var deferred = Q.defer();
    var replacements = {merchant_id : merchant_id};

    var query = 'select COUNT(*) as created from Coupons WHERE user_id=:merchant_id';

    models.sequelize.query(query,
        { replacements: replacements, type: models.sequelize.QueryTypes.SELECT }
    ).then(function(createdCounts) {
        var object = {};
        countsForCommunity(merchant_id).then(function(commCounts) {
            countsForCustom(merchant_id).then(function(cusCounts) {
                countsForUsedCoupons(merchant_id).then(function(usedCounts) {
                    countsForRequests(merchant_id).then(function(reqCounts) {
                        object.created = createdCounts[0];
                        object.community = commCounts[0];
                        object.custom = cusCounts[0];
                        object.used = usedCounts[0];
                        object.requests = reqCounts[0];
                        deferred.resolve(object);
            },function(err){
                deferred.reject(err)
                });
        },function(err){
            deferred.reject(err)
        });
    },function(err){
        deferred.reject(err)
    });
            },function(err){
                deferred.reject(err)
            });
        }
    );
    return deferred.promise;
};




var countsForCommunity = function(merchant_id){
    var deferred = Q.defer();
    var replacements = {merchant_id : merchant_id};

    var query = 'select COUNT(*) as community from Coupons WHERE user_id=:merchant_id and coupon_type="community"';

    models.sequelize.query(query,
        { replacements: replacements, type: models.sequelize.QueryTypes.SELECT }
    ).then(function(coummnityCounts) {
        deferred.resolve(coummnityCounts);

        }
    );
    return deferred.promise;
};




var countsForCustom = function(merchant_id){
    var deferred = Q.defer();
    var replacements = {merchant_id : merchant_id};

    var query = 'select COUNT(*) as custom from AcceptRequests WHERE merchant_id=:merchant_id';

    models.sequelize.query(query,
        { replacements: replacements, type: models.sequelize.QueryTypes.SELECT }
    ).then(function(customCounts) {
        deferred.resolve(customCounts);

        }
    );
    return deferred.promise;
};



var countsForUsedCoupons = function(merchant_id){
    var deferred = Q.defer();
    var replacements = {merchant_id : merchant_id};

    var query = 'select COUNT(*) as used from UsedCoupons WHERE merchant_id=:merchant_id';

    models.sequelize.query(query,
        { replacements: replacements, type: models.sequelize.QueryTypes.SELECT }
    ).then(function(usedCounts) {
        deferred.resolve(usedCounts);

        }
    );
    return deferred.promise;
};



var countsForRequests = function(merchant_id){
    var deferred = Q.defer();
    var replacements = {merchant_id : merchant_id};

    var query = 'select COUNT(*) as requests from Requests where merchant_id=:merchant_id';

    models.sequelize.query(query,
        { replacements: replacements, type: models.sequelize.QueryTypes.SELECT }
    ).then(function(usedCounts) {
        deferred.resolve(usedCounts);

        }
    );
    return deferred.promise;
};
