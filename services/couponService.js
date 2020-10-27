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
var uniqid = require('uniqid');
var userService = require('../services/UsersService.js');



/*
*   Function for create coupon .................
*/
var createCouponForMerchant = exports.createCouponForMerchant = function(user_id,coupon_type,days,start_time,end_time,expiry_date,flash_deal,description,restriction, shortName, consumerId){
    var deferred = Q.defer();
    var couponCode = uniqid('COUPON','CODE')
    var consumerIdValue;
    var pendingValue;
    if (coupon_type == "custom"){
        consumerIdValue = consumerId;
        pendingValue = "pending";
    } else {
        consumerIdValue =  null;
        pendingValue = null;
    }
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
        short_name: shortName,
        coupon_code: couponCode,
        consumer_id: consumerIdValue,
        status: pendingValue
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
var updateCouponForMerchant = exports.updateCouponForMerchant = function(user_id,coupon_id,coupon_type,days,start_time,end_time,expiry_date,flash_deal,description,restriction,shortName,consumerId,status){
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
        short_name: shortName,
        consumer_id: consumerId,
        status: status
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
* Fuction define for get All custom coupons for consumer
*/
exports.getAllCustomCuponsForConsumer = function(consumer_id){
    var deferred = Q.defer();
    var cond={"is_deleted":0,
                "consumer_id":consumer_id
    };
    models.Coupons.findAll({
      where: cond
    }).then(function (allCustomCoupons) {
            deferred.resolve(allCustomCoupons);
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
        var obj = {};
        createCouponForMerchant(merchant_id,"custom",null,null,null,null,null,null,null,null,consumer_id).then(function(result) {
            console.log(result.id);
            obj.detail = requestDetail;
            obj.coupon_id = result.id;
            addCouponIdtoRequest(requestDetail.id,result.id).then(function(update) {
            deferred.resolve(obj);
        },function(err){
            deferred.reject(err)
            });
        },function(err){
            deferred.reject(err)
            });
    },function(err){
        deferred.reject(err)
    });
    return deferred.promise;
};



var addCouponIdtoRequest = function(request_id,coupon_id){
    var deferred = Q.defer();
        models.Requests.update({
            coupon_id: coupon_id
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
* Fuction define for get All request list from database for merchant
*/
exports.getAllRequestForMerchant = function(merchant_id){
    var deferred = Q.defer();
    var replacements = {merchant_id : merchant_id};
    var query = 'select Requests.id as request_id,Requests.consumer_id,Requests.merchant_id,Requests.sub_category_id,Requests.detail,' +
                'Requests.date,Requests.time,Requests.coupon_id,Users.email from Requests LEFT JOIN Users on Requests.consumer_id=Users.id  where Requests.merchant_id=:merchant_id';
    
    models.sequelize.query(query,
        { replacements: replacements, type: models.sequelize.QueryTypes.SELECT }
    ).then(function(result) {
        deferred.resolve(result);

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
    var data = [];
    var replacements = {sub_category_id : sub_category_id};
    var query = 'SELECT Registrations.*, MAX(UserSubCateMaps.createdAt) as sub_cat_created , GROUP_CONCAT(UploadImgs.image ORDER BY UploadImgs.image) AS images ' +
                'FROM UserSubCateMaps LEFT JOIN Registrations ON Registrations.user_id = UserSubCateMaps.user_id LEFT JOIN UploadImgs ON UploadImgs.user_id = Registrations.user_id ' +
                 'WHERE UserSubCateMaps.sub_category_id=:sub_category_id GROUP BY Registrations.id';

    models.sequelize.query(query,
        { replacements: replacements, type: models.sequelize.QueryTypes.SELECT }
        ).then(function(result) {
            deferred.resolve(result);
    
            }
        );
        return deferred.promise;
    };



exports.findFavMerchant = function(consumer_id,merchant_id){
    var deferred = Q.defer();
    var cond={
                "consumer_id": consumer_id,
                "merchant_id": merchant_id
        };
    models.FavMerchants.findOne({
        where: cond
    }).then(function (result) {
            deferred.resolve(result);
        },function (err) {
            deferred.reject(err);
        }
    );
    return deferred.promise;
};
    





exports.getAllcouponByUserId = function(merchant_id, consumer_id){
    var deferred = Q.defer();
    var replacements = {merchant_id : merchant_id, consumer_id : consumer_id};

    var query = 'SELECT Coupons.id as coupon_id,Coupons.user_id as merchant_id,Coupons.coupon_type,Coupons.days,Coupons.start_time,Coupons.end_time,' +
                'Coupons.expiry_date,Coupons.flash_deal,Coupons.description,Coupons.restriction,Coupons.short_name,Coupons.coupon_code FROM Coupons WHERE NOT EXISTS' +
                ' ( SELECT * FROM UsedCoupons WHERE Coupons.coupon_code=UsedCoupons.coupon_code AND ' +
                'UsedCoupons.consumer_id=:consumer_id ) AND Coupons.user_id=:merchant_id ORDER BY Coupons.coupon_code ASC';

    models.sequelize.query(query,
        { replacements: replacements, type: models.sequelize.QueryTypes.SELECT }
    ).then(function(data) {
        deferred.resolve(data);

        }
    );
    return deferred.promise;
};



exports.addUsedCoupontoDatabase = function(consumer_id, merchant_id, coupon_code, coupon_type){
    var deferred = Q.defer();
    models.UsedCoupons.create({
        consumer_id: consumer_id,
        merchant_id: merchant_id,
        coupon_code: coupon_code,
        coupon_type: coupon_type,
        
    }).then(function(couponUsed) {
        deferred.resolve(couponUsed);
    },function(err){
        deferred.reject(err)
    });
    return deferred.promise;
};


exports.acceptRequestFunction = function(consumer_id, merchant_id, request_id, is_accepted, coupon_id){
    var deferred = Q.defer();
    var action;
    if (is_accepted == 1){
        action = "accept";
    } else if (is_accepted == 0){
        action = "reject";
    }
    models.AcceptRequest.create({
        consumer_id: consumer_id,
        merchant_id: merchant_id,
        request_id: request_id,
        is_accepted: is_accepted
        
    }).then(function(requestAccpeted) {
        updateCouponForMerchant(merchant_id,coupon_id,"custom",null,null,null,null,null,null,null,null,consumer_id,action).then(function(result) {
            deferred.resolve(requestAccpeted);    
        },function(err){
            deferred.reject(err)
            });
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



/*  Function for favourite and unfavourite merchants .............. */
exports.addToFavourite = function(consumer_id, merchant_id){
    var deferred = Q.defer();
    findFavMerchant(consumer_id, merchant_id).then(function(foundData) {
        if (foundData != null || undefined){
            if (foundData.dataValues.consumer_id == consumer_id && foundData.dataValues.merchant_id == merchant_id && foundData.dataValues.is_fav == 1) {
                models.FavMerchants.update({
                    is_fav: 0
                },{
                    where: {
                        consumer_id: consumer_id,
                        merchant_id: merchant_id
                    }
                }).then(function(added) {
                    deferred.resolve(added);
                },function(err){
                    deferred.reject(err)
                });
            } else if (foundData.dataValues.consumer_id == consumer_id && foundData.dataValues.merchant_id == merchant_id && foundData.dataValues.is_fav == 0) {
                models.FavMerchants.update({
                    is_fav: 1
                },{
                    where: {
                        consumer_id: consumer_id,
                        merchant_id: merchant_id
                    }
                }).then(function(added) {
                    deferred.resolve(added);
                },function(err){
                    deferred.reject(err)
                });

            }
         } else { 
            models.FavMerchants.create({
                consumer_id: consumer_id,
                merchant_id: merchant_id,
                is_fav: 1
                
            }).then(function(added) {
                deferred.resolve(added);
            },function(err){
                deferred.reject(err)
            });
        }
},function(err){
    deferred.reject(err)
});
    return deferred.promise;
};





var findFavMerchant = function(consumer_id, merchant_id){
    var deferred = Q.defer();
    var cond={
                "consumer_id": consumer_id,
                "merchant_id": merchant_id,
               
    };
    models.FavMerchants.findOne({
      where: cond
    }).then(function (result) {
            deferred.resolve(result);
        },function (err) {
          deferred.reject(err);
        }
    );
    return deferred.promise;
};







exports.getAllFavouriteMerchaants = function(consumer_id){
    var deferred = Q.defer();
    var replacements = {consumer_id : consumer_id};

    var query = 'SELECT Registrations.user_id as merchant_id, Registrations.address,Registrations.city,Registrations.state,Registrations.zipcode,Registrations.business_name,Registrations.tagline,Registrations.website,' +
                'Registrations.phone_no,Registrations.business_license_no,Registrations.description,Registrations.opening_time,Registrations.closing_time,Registrations.lat,Registrations.lang,GROUP_CONCAT(UploadImgs.image ORDER BY UploadImgs.image) AS images FROM Registrations' +
                ' LEFT JOIN FavMerchants on Registrations.user_id=FavMerchants.merchant_id LEFT JOIN UploadImgs ON UploadImgs.user_id = Registrations.user_id WHERE FavMerchants.is_fav=1' +
                ' and FavMerchants.consumer_id=:consumer_id GROUP BY Registrations.id';

    models.sequelize.query(query,
        { replacements: replacements, type: models.sequelize.QueryTypes.SELECT }
    ).then(function (allCoupons) {
        deferred.resolve(allCoupons);
        },function (err) {
          deferred.reject(err);
        }
    );
    return deferred.promise;
};




exports.getAllCountsForConsumerCoupons = function(consumer_id){
    var deferred = Q.defer();
    var replacements = {consumer_id : consumer_id};

    var query = 'select COUNT(*) as requested from Requests WHERE consumer_id=:consumer_id';

    models.sequelize.query(query,
        { replacements: replacements, type: models.sequelize.QueryTypes.SELECT }
    ).then(function(requestedCounts) {
        var object = {};
        countsForUsed(consumer_id).then(function(Counts) {
            object.requested = requestedCounts[0];
            object.used = Counts[0];
            deferred.resolve(object);
            },function(err){
                deferred.reject(err)
            });
        }
    );
    return deferred.promise;
};


var countsForUsed = function(consumer_id){
    var deferred = Q.defer();
    var replacements = {consumer_id : consumer_id};

    var query = 'select COUNT(*) as used from AcceptRequests WHERE consumer_id=:consumer_id';

    models.sequelize.query(query,
        { replacements: replacements, type: models.sequelize.QueryTypes.SELECT }
    ).then(function(usedCounts) {
        deferred.resolve(usedCounts);

        }
    );
    return deferred.promise;
};


exports.getAllUsedCoupons = function(consumer_id){
    var deferred = Q.defer();
    var replacements = {consumer_id : consumer_id};

    var query = 'select Coupons.id as coupon_id,Coupons.user_id as merchant_id,Coupons.coupon_type,Coupons.days,Coupons.start_time,Coupons.end_time,' +
                'Coupons.expiry_date,Coupons.description,Coupons.restriction,Coupons.short_name,Coupons.coupon_code' + 
                ' from Coupons left join UsedCoupons on Coupons.coupon_code=UsedCoupons.coupon_code where UsedCoupons.consumer_id=:consumer_id';
    

    models.sequelize.query(query,
        { replacements: replacements, type: models.sequelize.QueryTypes.SELECT }
    ).then(function(usedCounts) {
        deferred.resolve(usedCounts);

        }
    );
    return deferred.promise;
};
