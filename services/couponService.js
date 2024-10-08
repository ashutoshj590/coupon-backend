var models = require('../models/index.js');
//var redis = require('../lib/redis.js');
var Q = require('q');
var async = require('async');
var userService = require('./UsersService.js');
var uniqid = require('uniqid');
const { response } = require('express');
var admin = require("firebase-admin");
var notificationConsts = require('../constants/notificationConsts');


/*
*   Function for create coupon .................
*/
var createCouponForMerchant = exports.createCouponForMerchant = function(user_id,sub_category_id,coupon_type,days,start_time,end_time,expiry_date,flash_deal,description,restriction,consumerId){
    var deferred = Q.defer();
    var couponCode = uniqid('COUPON','CODE')
    var consumerIdValue;
    var pendingValue;
    var userId;
    if (coupon_type == "custom"){
        consumerIdValue = consumerId;
        pendingValue = "pending";
    } else {
        consumerIdValue =  null;
        pendingValue = null;
    }
    if (user_id == null){
        userId = null;
    } else {
       userId = user_id;
    }
    models.Coupons.create({
        user_id: userId,
        sub_category_id: sub_category_id, 
        coupon_type: coupon_type,
        days: days,
        start_time: start_time,
        end_time: end_time,
        expiry_date: expiry_date,
        flash_deal: flash_deal,
        description: description,
        restriction: restriction,
        is_deleted: 0,
        coupon_code: couponCode,
        consumer_id: consumerIdValue,
        status: pendingValue,
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
var updateCouponForMerchant = exports.updateCouponForMerchant = function(consumer_id,request_id,user_id,sub_cate_id,coupon_id,coupon_type,days,start_time,end_time,expiry_date,flash_deal,description,restriction,status){
    var deferred = Q.defer();
    if (coupon_type != "custom"){
        var subCateId = sub_cate_id
     }
     findCouponById(coupon_id,user_id).then(function(getcoupon) {
 if(getcoupon){
    models.Coupons.update({
        sub_category_id: subCateId,
        coupon_type: coupon_type,
        days: days,
        start_time: start_time,
        end_time: end_time,
        expiry_date: expiry_date,
        flash_deal: flash_deal,
        description: description,
        restriction: restriction,
        consumer_id: consumer_id,
        status: status 
     } ,  {
            where:{
                id: coupon_id,
                user_id: user_id
            }
    }).then(function(couponUpdate) {
        if (coupon_type === "custom" && status != "reject") {
        acceptRequestFunction(consumer_id, user_id, request_id, 1).then(function(accept) {
        userService.getTokenFromdb(consumer_id).then(function(newData){
            if (newData){
            admin.messaging().sendToDevice(newData.token, notificationConsts.NOTIFICATION__CONSTS.request_accept, notificationConsts.NOTIFICATION__CONSTS.options).then(function(response) {
  
                console.log("successfullee send message", response);
                deferred.resolve(couponUpdate);


            })
            .catch(function(error) {
                console.log("error send message", error);
            })
        } else {
            console.log("without notifications");
            deferred.resolve(couponUsed);
        }
        },function(err){
            deferred.reject(err)
        })
    
        },function(err){
            deferred.reject(err)
            });
        } else {
            userService.getTokenFromdb(consumer_id).then(function(newData){
                if (newData){
                admin.messaging().sendToDevice(newData.token, notificationConsts.NOTIFICATION__CONSTS.reject_request, notificationConsts.NOTIFICATION__CONSTS.options).then(function(response) {
      
                    console.log("successfullee send message", response);
                    deferred.resolve(couponUpdate);

                })
                .catch(function(error) {
                    console.log("error send message", error);
                })
            } else {
                console.log("without notifications");
                deferred.resolve(couponUpdate);
            }
            },function(err){
                deferred.reject(err)
            })
        }
    },function(err){
        deferred.reject(err)
    });
} else {
    deferred.reject("Coupon not found!");
 }
          
}, function(err){
deferred.reject(err);
}) 
    return deferred.promise;
};



exports.updateCustomCouponForMerchant = function(user_id,coupon_id,days,start_time,end_time,expiry_date,flash_deal,description,restriction){
    var deferred = Q.defer();
    models.Coupons.update({
        days: days,
        start_time: start_time,
        end_time: end_time,
        expiry_date: expiry_date,
        flash_deal: flash_deal,
        description: description,
        restriction: restriction
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
exports.getAllcoupon = function(merchant_id){
    var deferred = Q.defer();
    if (merchant_id == null){
        var replacements = {};
        var querySet = ''

    } else {
    var replacements = {merchant_id : merchant_id};
    var querySet = ' AND Coupons.user_id=:merchant_id'
    }
     var query = 'select Coupons.*,GROUP_CONCAT(UploadImgs.image ORDER BY UploadImgs.image) AS images'+
                ' FROM Coupons LEFT JOIN UploadImgs ON UploadImgs.coupon_id = Coupons.id where Coupons.is_deleted=0' + querySet + ' GROUP BY Coupons.id';

    models.sequelize.query(query,
        { replacements: replacements, type: models.sequelize.QueryTypes.SELECT }
    ).then(function(allcoupons) {
        deferred.resolve(allcoupons);

    }
);
return deferred.promise;
};





exports.getAllcouponAdmin = function(){
    var deferred = Q.defer();
    
    var replacements = {};

     var query = 'select Coupons.*,Users.email,SubCategories.name FROM Coupons LEFT JOIN Users ON Users.id = Coupons.user_id'+
                ' LEFT JOIN SubCategories ON SubCategories.id = Coupons.sub_category_id where Coupons.is_deleted=0 GROUP BY Coupons.id';

    models.sequelize.query(query,
        { replacements: replacements, type: models.sequelize.QueryTypes.SELECT }
    ).then(function(allcoupons) {
        var output = [];
        async.eachSeries(allcoupons,function(data,callback){ 
            singleUsedCouponsAdmin(data.coupon_code).then(function(newData){
                data.used_coupons = newData.length;
                output.push(data);
                callback();
            }, function(err){
               deferred.reject(err);
            })
   
       }, function(err, detail) {
             deferred.resolve(output);
           
       });
        
    });
    return deferred.promise;
};

      
/*
* Fuction define for get All custom coupons for consumer
*/
exports.getAllCustomCuponsForConsumer = function(consumer_id){
    var deferred = Q.defer();
    var replacements = {consumer_id : consumer_id};

    var query = 'SELECT * FROM Coupons WHERE NOT EXISTS' +
                ' ( SELECT * FROM UsedCoupons WHERE Coupons.coupon_code=UsedCoupons.coupon_code AND ' +
                'UsedCoupons.consumer_id=:consumer_id ) AND Coupons.consumer_id=:consumer_id ORDER BY Coupons.coupon_code ASC';

    models.sequelize.query(query,
        { replacements: replacements, type: models.sequelize.QueryTypes.SELECT }
    ).then(function(result) {
        var output = [];
            async.eachSeries(result,function(data,callback){ 
                getAllImgsMerchant(data.user_id).then(function(newData){
                    data.merchant_images = newData;
                    output.push(data);
                    callback();
                }, function(err){
                   deferred.reject(err);
                })
       
           }, function(err, detail) {
                 deferred.resolve(output);
               
           });
            
        });
        return deferred.promise;
    };


/*
*   Function for create request .................
*/
exports.addRequestForMerchant = function(consumer_id, sub_category_id, detail, date, time){
    var deferred = Q.defer();
    models.Requests.create({
        consumer_id: consumer_id,
        sub_category_id: sub_category_id,
        detail: detail,
        date: date,
        time: time,
        is_deleted: 0,
        is_allow: 2
        
    }).then(function(requestDetail) {
        var obj = {};
        createCouponForMerchant(null,sub_category_id,"custom",null,null,null,null,null,null,null,consumer_id).then(function(result) {
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


/* function for get merdahnt ids by su cate id  */
var getMerchantIdsBySubCate = function(sub_category_id){
    var deferred = Q.defer();
    var replacements = {sub_category_id : sub_category_id }
        var query = 'SELECT Registrations.*, MAX(UserSubCateMaps.createdAt) as sub_cat_created ' +
                'FROM UserSubCateMaps LEFT JOIN Registrations ON Registrations.user_id = UserSubCateMaps.user_id ' +
                 'WHERE Registrations.status=1 AND UserSubCateMaps.sub_category_id IN (:sub_category_id) GROUP BY Registrations.id';

    models.sequelize.query(query,
        { replacements: replacements, type: models.sequelize.QueryTypes.SELECT }
    ).then(function(merchantids) {
        deferred.resolve(merchantids);

        }
    );
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

    /*var query = 'select Requests.id as request_id,Requests.consumer_id,Requests.merchant_id,Requests.sub_category_id,Requests.detail,' +
                'Requests.date,Requests.time,Requests.coupon_id,Users.email from Requests LEFT JOIN Users ON Requests.consumer_id=Users.id' +
                ' where Requests.merchant_id=:merchant_id and NOT EXISTS (select * from AcceptRequests where Requests.id=AcceptRequests.request_id)'; */

     var query = 'select Requests.id as request_id,Requests.consumer_id,Requests.sub_category_id,Requests.detail,Requests.date,Requests.time,Requests.coupon_id,' +
                    'Requests.createdAt,Requests.updatedAt' +
                ' from Requests left join UserSubCateMaps on Requests.sub_category_id=UserSubCateMaps.sub_category_id where Requests.is_allow=1 AND UserSubCateMaps.user_id=:merchant_id' +
                ' and NOT EXISTS (select * from AcceptRequests where Requests.id=AcceptRequests.request_id AND AcceptRequests.consumer_id=Requests.consumer_id AND AcceptRequests.is_accepted=0) ORDER BY Requests.id ASC';           
    
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
    var replacements = {consumer_id : consumer_id};
     var query = 'select Requests.id as request_id,Requests.consumer_id,Requests.sub_category_id,Requests.detail,Requests.date,Requests.time,Requests.coupon_id,' +
                    'Requests.createdAt,Requests.updatedAt,SubCategories.name as sub_category_name,SubCategories.img_url,Categories.name as category_name,AcceptRequests.is_accepted,AcceptRequests.merchant_id' +
                ' from Requests LEFT JOIN SubCategories ON Requests.sub_category_id=SubCategories.id LEFT JOIN Categories ON SubCategories.category_id=Categories.id' +
                ' LEFT JOIN AcceptRequests ON AcceptRequests.request_id=Requests.id WHERE Requests.consumer_id=:consumer_id AND Requests.is_deleted=0 AND Requests.is_allow=1';
    
    models.sequelize.query(query,
        { replacements: replacements, type: models.sequelize.QueryTypes.SELECT }
    ).then(function(result) {    
        var output = [];
        async.eachSeries(result,function(data,callback){ //getCouponDetail
            if (data.merchant_id != null || undefined) {
            getMerchantDetailForReqCoupons(data.merchant_id, data.coupon_id).then(function(newData){
                if (data.is_accepted != 1){
                delete data.merchant_id;
                data.merchant_detail = [];
                output.push(data);
                callback();
                } else {
                    findAcceptReq(data.consumer_id,data.merchant_id,data.request_id).then(function(getdata) {
                    if(getdata){
                    data.merchant_detail = newData;
                    output.push(data);
                    callback();
                    } else {
                        delete data.merchant_id;
                        data.is_accepted = 0;
                        data.merchant_detail = [];
                        output.push(data);
                        callback();
                    }
                }, function(err){
                    deferred.reject(err);
                 })
            
                }
        }, function(err){
            deferred.reject(err);
         })

        } else {
                delete data.merchant_id;
                data.merchant_detail = [];
                output.push(data);
                callback();
        }
      
       }, function(err, detail) {
             deferred.resolve(output);
           
       });
        
    });
    return deferred.promise;
};


          



var findAcceptReq = function(consumer_id,merchant_id,request_id){
    var deferred = Q.defer();
    var cond={
                "consumer_id": consumer_id,
                "merchant_id": merchant_id,
                "request_id": request_id
        };
    models.AcceptRequest.findOne({
        where: cond
    }).then(function (result) {
            deferred.resolve(result);
        },function (err) {
            deferred.reject(err);
        }
    );
    return deferred.promise;
};



var findCouponById = function(coupon_id, user_id){
    var deferred = Q.defer();
    var cond={
                "id": coupon_id,
                "user_id": user_id
        };
    models.Coupons.findOne({
        where: cond
    }).then(function (result) {
            deferred.resolve(result);
        },function (err) {
            deferred.reject(err);
        }
    );
    return deferred.promise;
};



exports.getMerchantDetailbySubCateId = function(sub_category_id, consumer_id, lat1, lon1, merchant_id, distance){
    var deferred = Q.defer();
    if(sub_category_id != null || undefined){
        var subCate = sub_category_id.split(",");
    
    }
       
    var dist = distance;
    if(dist == null){
        dist = 10;
    } else {
        dist = distance;
    }
    if (merchant_id == null && sub_category_id != null){
        var replacements = {subCate : subCate }
        var query = 'SELECT Registrations.*, MAX(UserSubCateMaps.createdAt) as sub_cat_created ' +
                'FROM UserSubCateMaps LEFT JOIN Registrations ON Registrations.user_id = UserSubCateMaps.user_id ' +
                 'WHERE Registrations.status=1 AND UserSubCateMaps.sub_category_id IN (:subCate) GROUP BY Registrations.id';
  
    } else if (merchant_id != null && sub_category_id != null) {
    var replacements = {subCate : subCate, merchant_id : merchant_id};
    var query = 'SELECT Registrations.*, MAX(UserSubCateMaps.createdAt) as sub_cat_created ' +
    'FROM UserSubCateMaps LEFT JOIN Registrations ON Registrations.user_id = UserSubCateMaps.user_id ' +
     'WHERE Registrations.status=1 AND UserSubCateMaps.sub_category_id IN (:subCate) AND Registrations.user_id=:merchant_id GROUP BY Registrations.id';
    }
    

   else if (subCate == null || undefined && merchant_id == null || undefined){
    var replacements = {};
        var query = 'SELECT Registrations.* ' +
                'FROM UserSubCateMaps LEFT JOIN Registrations ON Registrations.user_id = UserSubCateMaps.user_id WHERE Registrations.status=1 ' +
                 'GROUP BY Registrations.user_id';

    } else {
        var replacements = {merchant_id : merchant_id};
        var query = 'SELECT Registrations.*, MAX(UserSubCateMaps.createdAt) as sub_cat_created ' +
        'FROM UserSubCateMaps LEFT JOIN Registrations ON Registrations.user_id = UserSubCateMaps.user_id ' +
         'WHERE Registrations.status=1 AND Registrations.user_id=:merchant_id GROUP BY Registrations.id';
    }  

   
    models.sequelize.query(query,
        { replacements: replacements, type: models.sequelize.QueryTypes.SELECT }
        ).then(function(result) {
            var output = [];    
           async.eachSeries(result,function(data,callback){
        getAllImgsMerchant(data.user_id).then(function(imgData){
            getAllcouponByUserId(data.user_id, consumer_id, sub_category_id).then(function(foundData){    
               data.images = imgData;
               data.couponDetail = foundData;
               output.push(data);
               callback();
          }, function(err){
              deferred.reject(err);
          })
        }, function(err){
            deferred.reject(err);
       })
          
        }, function(err, detail) {
            result.coupon_detail = output;
            var output1 = [];
         result.forEach(function(obj, index) {
             var unit =  "M";       //commented when value need in miles
             var data = calculatedistance(lat1, lon1, obj.lat, obj.lang, unit);
            // obj.distance = data;
             if (data <= dist){ 
             output1.push(obj);
             }
         })
           deferred.resolve(output1);   
           // deferred.resolve(result);
        });
                  
     });
        
         return deferred.promise;
     };





    
  




exports.getCouponsBySerach = function(search_query, consumer_id){
  var searchQuery = search_query+'%';
  var deferred = Q.defer();
  var consumerID = consumer_id;
  if (consumerID == null){
      var replacements = {search_query : searchQuery};
      var querySet = ''

  } else {
  var replacements = {search_query : searchQuery, consumer_id : consumerID};
  var querySet = ' AND NOT EXISTS ( SELECT * FROM UsedCoupons WHERE Coupons.coupon_code=UsedCoupons.coupon_code AND UsedCoupons.consumer_id=:consumer_id ) ORDER BY Coupons.coupon_code ASC'
  }
  
    var query = 'SELECT Coupons.id as coupon_id,Coupons.user_id as merchant_id,Coupons.coupon_type,Coupons.days,Coupons.start_time,Coupons.end_time,' +
                'Coupons.expiry_date,Coupons.flash_deal,Coupons.description,Coupons.restriction,Coupons.createdAt,Coupons.updatedAt,Coupons.coupon_code,' +
                'Registrations.business_name as merchant_name,Registrations.lat,Registrations.lang,SubCategories.name as category_name FROM Coupons LEFT JOIN Registrations ON Coupons.user_id=Registrations.user_id' +
                ' LEFT JOIN SubCategories ON Coupons.sub_category_id=SubCategories.id where NOT Coupons.coupon_type="custom" AND Coupons.is_deleted=0 AND ( Coupons.description like :search_query OR Coupons.coupon_type like :search_query' +
                ' OR Registrations.business_name like :search_query OR SubCategories.name like :search_query )' + querySet;
              
  models.sequelize.query(query,
      { replacements: replacements, type: models.sequelize.QueryTypes.SELECT }
      ).then(function(result) {
        var output = [];
        async.eachSeries(result,function(data,callback){ 
            getAllImgsMerchant(data.merchant_id).then(function(newData){
                data.images = newData;
                output.push(data);
                callback();
            }, function(err){
               deferred.reject(err);
            })
   
       }, function(err, detail) {
             deferred.resolve(output);
           
       });
        
    });
    return deferred.promise;
};



    
//where Registrations.business_name like :search_query';
var calculatedistance = exports.calculatedistance = function(lat1, lon1, lat2, lon2, unit){
    if ((lat1 == lat2) && (lon1 == lon2)) {
		return 0;
	}
	else {
		var radlat1 = Math.PI * lat1/180;
		var radlat2 = Math.PI * lat2/180;
		var theta = lon1-lon2;
		var radtheta = Math.PI * theta/180;
		var dist = Math.sin(radlat1) * Math.sin(radlat2) + Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta);
		if (dist > 1) {
			dist = 1;
		}
		dist = Math.acos(dist);
		dist = dist * 180/Math.PI;
		dist = dist * 60 * 1.1515;
		if (unit=="K") { dist = dist * 1.609344 }
		if (unit=="N") { dist = dist * 0.8684 }
		return dist;
	
    }
}

  

var findFavMerchant = exports.findFavMerchant = function(consumer_id,merchant_id){
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



var findFavCoupons = exports.findFavCoupons = function(consumer_id,merchant_id,coupon_id){
    var deferred = Q.defer();
    var cond={
                "consumer_id": consumer_id,
                "merchant_id": merchant_id,
                "coupon_id": coupon_id
        };
    models.FavCoupon.findOne({
        where: cond
    }).then(function (result) {
            deferred.resolve(result);
        },function (err) {
            deferred.reject(err);
        }
    );
    return deferred.promise;
};

/*var findFavMerchantTest = function(consumer_id,merchant_id){
    var cond={
                "consumer_id": consumer_id,
                "merchant_id": merchant_id
        };
    models.FavMerchants.findOne({
        where: cond
    }).then(function (result) {
           return result;
        },function (err) {
            return err;
        }
    );
    NOT EXISTS' +
                 ' ( SELECT * FROM BlockMerchants WHERE Registrations.user_id=BlockMerchants.merchant_id AND BlockMerchants.is_blocked=1 AND' +
                 ' BlockMerchants.consumer_id=:consumer_id ) AND
    
}; */




var getAllcouponByUserId = exports.getAllcouponByUserId = function(merchant_id, consumer_id, sub_category_id){
    var deferred = Q.defer();
    if(sub_category_id != null || undefined){
        var subCate = sub_category_id.split(",");
        var querySet = ' AND Coupons.sub_category_id IN (:subCate)'
    
    } else {
        var subCate = null
        var querySet = '' 
    }

    if (consumer_id != null || undefined){
        var querySet1 = 'NOT EXISTS ( SELECT * FROM UsedCoupons WHERE Coupons.coupon_code=UsedCoupons.coupon_code AND UsedCoupons.consumer_id=:consumer_id ) AND NOT EXISTS ( SELECT * FROM BlockMerchants WHERE Coupons.id=BlockMerchants.coupon_id AND BlockMerchants.consumer_id=:consumer_id ) AND'
    }
    else {
        var querySet1 = '' 
    }

    var replacements = {merchant_id : merchant_id, consumer_id : consumer_id, subCate : subCate};

    var query = 'SELECT Coupons.id as coupon_id,Coupons.user_id as merchant_id,Coupons.coupon_type,Coupons.days,Coupons.start_time,Coupons.end_time,' +
                'Coupons.expiry_date,Coupons.flash_deal,Coupons.description,Coupons.restriction,Coupons.coupon_code,Coupons.sub_category_id,GROUP_CONCAT(UploadImgs.image ORDER BY UploadImgs.image) AS images'+ 
                ' FROM Coupons LEFT JOIN UploadImgs ON UploadImgs.coupon_id = Coupons.id WHERE '+querySet1+
                ' Coupons.user_id=:merchant_id '+querySet+' AND NOT Coupons.coupon_type="custom" AND STR_TO_DATE(Coupons.expiry_date,"%d%M%Y %h%i") >= current_date() AND Coupons.is_deleted=0 GROUP BY Coupons.id';

    models.sequelize.query(query,
        { replacements: replacements, type: models.sequelize.QueryTypes.SELECT }
    ).then(function(data1) {
        var output = [];
        async.eachSeries(data1,function(data2,callback){
            data2.is_fav = false;
            findFavCoupons(consumer_id, data2.merchant_id, data2.coupon_id).then(function(foundData){
               if (foundData != null || undefined){
                   if (foundData.consumer_id == consumer_id && foundData.merchant_id == data2.merchant_id && foundData.coupon_id == data2.coupon_id && foundData.is_fav == 1) {
                       data2.is_fav = true;
                      
                   } else if (foundData.consumer_id == consumer_id && foundData.merchant_id == data2.merchant_id && foundData.coupon_id == data2.coupon_id && foundData.is_fav == 0) {
                       data2.is_fav = false;
                      
                   }
               }
             //  output.push(data2);
             if (data2.coupon_id == null || undefined){
                output.push();
             } else {
                output.push(data2);
             }

               callback();
            }, function(err){
               deferred.reject(err);
            })
     
       }, function(err, detail) {
             deferred.resolve(output);
           
       });
        
    });
    return deferred.promise;
};


exports.addUsedCoupontoDatabase = function(consumer_id, merchant_id, coupon_code, coupon_type,lat,lang){
    var deferred = Q.defer();
    models.UsedCoupons.create({
        consumer_id: consumer_id,
        merchant_id: merchant_id,
        coupon_code: coupon_code,
        coupon_type: coupon_type,
        lat: lat,
        lang: lang
        
    }).then(function(couponUsed) {
        userService.getTokenFromdb(merchant_id).then(function(newData){
            if (newData){
            admin.messaging().sendToDevice(newData.token, notificationConsts.NOTIFICATION__CONSTS.used_coupon, notificationConsts.NOTIFICATION__CONSTS.options).then(function(response) {
  
                console.log("successfullee send message", response);
                deferred.resolve(couponUsed);

            })
            .catch(function(error) {
                console.log("error send message", error);
            })
        } else {
            console.log("without notifications");
            deferred.resolve(couponUsed);
        }
        },function(err){
            deferred.reject(err)
        })
    },function(err){
        deferred.reject(err)
    });
    return deferred.promise;
};


var acceptRequestFunction = exports.acceptRequestFunction = function(consumer_id, merchant_id, request_id, is_accepted){
   
    var deferred = Q.defer();
    var action;
    if (is_accepted == 1){
        
        action = "accept";
    } else if (is_accepted == 0){
        action = "reject";
        
    }
    
    findAcceptReq(consumer_id,merchant_id,request_id).then(function(getdata) {
        if(getdata){
           
            models.AcceptRequest.update({
                consumer_id: consumer_id,
                merchant_id: merchant_id,
                request_id: request_id,
            },{
                where: {
                    id: getdata.dataValues.id
                }
            }).then(function(added) {    
                deferred.resolve(added);
            },function(err){
                deferred.reject(err)
            });

        } else {
            
    models.AcceptRequest.create({
        consumer_id: consumer_id,
        merchant_id: merchant_id,
        request_id: request_id,
        is_accepted: is_accepted
        
    }).then(function(requestAccpeted) {
        
        deferred.resolve(requestAccpeted);
    },function(err){
       
        deferred.reject(err)
        });
    }    
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



var singleUsedCouponsAdmin = function(coupon_code){
    var deferred = Q.defer();
    var replacements = {coupon_code : coupon_code};

    var query = 'select * from UsedCoupons WHERE coupon_code=:coupon_code';

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
            if (foundData.consumer_id == consumer_id && foundData.merchant_id == merchant_id && foundData.is_fav == 1) {
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
            } else if (foundData.consumer_id == consumer_id && foundData.merchant_id == merchant_id && foundData.is_fav == 0) {
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



/*  Function for favourite and unfavourite coupons .............. */
exports.addToFavouriteCoupon = function(consumer_id, merchant_id, coupon_id){
    var deferred = Q.defer();
    findFavCoupons(consumer_id, merchant_id, coupon_id).then(function(foundData) {
        if (foundData != null || undefined){
            if (foundData.consumer_id == consumer_id && foundData.merchant_id == merchant_id && foundData.coupon_id == coupon_id && foundData.is_fav == 1) {
                models.FavCoupon.update({
                    is_fav: 0
                },{
                    where: {
                        consumer_id: consumer_id,
                        merchant_id: merchant_id,
                        coupon_id: coupon_id
                    }
                }).then(function(added) {
                    deferred.resolve(added);
                },function(err){
                    deferred.reject(err)
                });
            } else if (foundData.consumer_id == consumer_id && foundData.merchant_id == merchant_id && foundData.coupon_id == coupon_id && foundData.is_fav == 0) {
                models.FavCoupon.update({
                    is_fav: 1
                },{
                    where: {
                        consumer_id: consumer_id,
                        merchant_id: merchant_id,
                        coupon_id: coupon_id
                    }
                }).then(function(added) {
                    deferred.resolve(added);
                },function(err){
                    deferred.reject(err)
                });

            }
         } else { 
            models.FavCoupon.create({
                consumer_id: consumer_id,
                merchant_id: merchant_id,
                coupon_id: coupon_id,
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





exports.getAllFavouriteMerchants = function(consumer_id){
    var deferred = Q.defer();
    var replacements = {consumer_id : consumer_id};

    var query = 'SELECT Registrations.user_id as merchant_id, Registrations.address,Registrations.city,Registrations.state,Registrations.zipcode,Registrations.business_name,Registrations.tagline,Registrations.website,' +
                'Registrations.phone_no,Registrations.business_license_no,Registrations.description,Registrations.opening_time,Registrations.closing_time,Registrations.lat,Registrations.lang,GROUP_CONCAT(UploadImgs.image ORDER BY UploadImgs.image) AS images FROM Registrations' +
                ' LEFT JOIN FavMerchants on Registrations.user_id=FavMerchants.merchant_id LEFT JOIN UploadImgs ON UploadImgs.user_id=Registrations.user_id WHERE FavMerchants.is_fav=1' +
                ' and FavMerchants.consumer_id=:consumer_id GROUP BY Registrations.id';

    models.sequelize.query(query,
        { replacements: replacements, type: models.sequelize.QueryTypes.SELECT }
    ).then(function (allCoupons) {
        var output = [];
        async.eachSeries(allCoupons,function(data,callback){
          //  getAllImgsMerchant(data.merchant_id).then(function(allimgs){ 
            findCategoryName(data.merchant_id).then(function(newData){
              //  data.images = allimgs;
                data.category_detail = newData[0];
                output.push(data);
                callback();
            }, function(err){
               deferred.reject(err);
            })
     //   }, function(err){
     //       deferred.reject(err);
     //    })
   
       }, function(err, detail) {
             deferred.resolve(output);
           
       });
        
    });
    return deferred.promise;
};




exports.getAllFavouriteCoupons = function(consumer_id, sub_category_id){
    var deferred = Q.defer();
    if(sub_category_id != null || undefined){
    var subCate = sub_category_id.split(",");

    }
    
    if (subCate == null || undefined){
       
    var replacements = {consumer_id : consumer_id};
    var query = 'select Registrations.* FROM FavCoupons LEFT JOIN Registrations ON Registrations.user_id=FavCoupons.merchant_id'+
                ' WHERE Registrations.status=1 AND FavCoupons.is_fav=1 AND FavCoupons.consumer_id=:consumer_id GROUP BY Registrations.id';
    } else {
    var replacements = {consumer_id : consumer_id, subCate: subCate};
    var query = 'SELECT Registrations.* FROM UserSubCateMaps LEFT JOIN Registrations ON Registrations.user_id = UserSubCateMaps.user_id'+
                ' WHERE EXISTS '+
                 '(select Registrations.* FROM FavCoupons LEFT JOIN Registrations ON Registrations.user_id=FavCoupons.merchant_id'+
                ' WHERE Registrations.status=1 AND FavCoupons.is_fav=1 AND FavCoupons.consumer_id=:consumer_id GROUP BY Registrations.id)'+
                ' AND Registrations.status=1 AND UserSubCateMaps.sub_category_id IN (:subCate) GROUP BY Registrations.id';
               
    }
    models.sequelize.query(query,
        { replacements: replacements, type: models.sequelize.QueryTypes.SELECT }
        
    ).then(function(allcps) {
        var output = [];
        async.eachSeries(allcps,function(data,callback){
                getAllImgsMerchant(data.user_id).then(function(imgAll){   
                getAllFavCoupons(data.user_id, consumer_id).then(function(newData){
                data.images = imgAll;
                data.couponDetail = newData;
                output.push(data);
                callback();
               
            }, function(err){
               deferred.reject(err);
            }) 
        }, function(err){
            deferred.reject(err);
         })
       
   
       }, function(err, detail) {
         deferred.resolve(output);
           
       });
        
    })
  
    return deferred.promise;
   
};


var getAllFavCoupons = function(merchant_id, consumer_id){
    var deferred = Q.defer();
    var replacements = {merchant_id : merchant_id, consumer_id : consumer_id};

    var query = 'select FavCoupons.coupon_id,Coupons.user_id as merchant_id,Coupons.coupon_type,Coupons.days,Coupons.start_time,Coupons.end_time,Coupons.expiry_date,' +
                ' Coupons.flash_deal,Coupons.description,Coupons.restriction,Coupons.createdAt,Coupons.updatedAt,Coupons.coupon_code' + 
                ' FROM FavCoupons LEFT JOIN Coupons ON FavCoupons.coupon_id=Coupons.id WHERE FavCoupons.consumer_id=:consumer_id AND FavCoupons.is_fav=1 AND Coupons.user_id=:merchant_id';
               

    models.sequelize.query(query,
        { replacements: replacements, type: models.sequelize.QueryTypes.SELECT }
    ).then(function(favCou) {
        var output = [];
        async.eachSeries(favCou,function(data,callback){
            getAllImgsByCouponId(data.coupon_id).then(function(newData){
                data.images = newData[0].images;
                output.push(data);
                callback();
            }, function(err){
               deferred.reject(err);
            })
   
       }, function(err, detail) {
             deferred.resolve(output);
           
       });
        
    });
    return deferred.promise;
}; 






var findCategoryName = function(merchant_id){
    var deferred = Q.defer();
    var replacements = {merchant_id : merchant_id};

    var query = ' select SubCategories.category_id,Categories.name as category_name  from UserSubCateMaps LEFT JOIN '+
                  'SubCategories on UserSubCateMaps.sub_category_id=SubCategories.id LEFT JOIN Categories on SubCategories.category_id=Categories.id where UserSubCateMaps.user_id=:merchant_id;';

    models.sequelize.query(query,
        { replacements: replacements, type: models.sequelize.QueryTypes.SELECT }
    ).then(function(categoryDetails) {
        deferred.resolve(categoryDetails);

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
                'Coupons.expiry_date,Coupons.description,Coupons.restriction,Coupons.coupon_code,GROUP_CONCAT(UploadImgs.image ORDER BY UploadImgs.image) AS images' + 
                ' FROM Coupons left join UsedCoupons on Coupons.coupon_code=UsedCoupons.coupon_code LEFT JOIN UploadImgs ON UploadImgs.coupon_id=Coupons.id where UsedCoupons.consumer_id=:consumer_id';
    

    models.sequelize.query(query,
        { replacements: replacements, type: models.sequelize.QueryTypes.SELECT }
    ).then(function(usedCounts) {
        var output = [];
            async.eachSeries(usedCounts,function(data,callback){ 
              //  getAllImgsMerchant(data.merchant_id).then(function(newData){
                    getMerchantDetail(data.merchant_id).then(function(newData1){
                 ///   data.merchant_images = newData;
                    data.merchant_detail = newData1;
                    output.push(data);
                    callback();
                }, function(err){
                   deferred.reject(err);
                })
          //  }, function(err){
           //     deferred.reject(err);
           //  })
       
           }, function(err, detail) {
                 deferred.resolve(output);
               
           });
            
        });
        return deferred.promise;
    };



var getAllImgsMerchant = function(merchant_id){
    var deferred = Q.defer();
    var replacements = {merchant_id : merchant_id};

    var query =  'SELECT UploadImgs.image from UploadImgs where UploadImgs.user_id=:merchant_id';

    models.sequelize.query(query,
        { replacements: replacements, type: models.sequelize.QueryTypes.SELECT }
    ).then(function(data) {
        deferred.resolve(data);

        }
    );
    return deferred.promise;
};



var getAllImgsByCouponId = function(coupon_id){
    var deferred = Q.defer();
    var replacements = {coupon_id : coupon_id};

    var query =  'select GROUP_CONCAT(UploadImgs.image ORDER BY UploadImgs.image) AS images FROM Coupons LEFT JOIN UploadImgs ON UploadImgs.coupon_id=Coupons.id where Coupons.id=:coupon_id';

    models.sequelize.query(query,
        { replacements: replacements, type: models.sequelize.QueryTypes.SELECT }
    ).then(function(data) {
        deferred.resolve(data);

        }
    );
    return deferred.promise;
};





var getMerchantDetail = function(merchant_id){
    var deferred = Q.defer();
    var replacements = {merchant_id : merchant_id};

    var query =  'SELECT * from Registrations where user_id =:merchant_id';

    models.sequelize.query(query,
        { replacements: replacements, type: models.sequelize.QueryTypes.SELECT }
    ).then(function(data) {
        deferred.resolve(data);

        }
    );
    return deferred.promise;
};

var getMerchantDetailForReqCoupons = function(merchant_id, coupon_id){
    var deferred = Q.defer();
    var replacements = {merchant_id : merchant_id};
    var query =  'SELECT Registrations.user_id as merchant_id,Registrations.address,Registrations.city,Registrations.state,Registrations.zipcode,'+
                'Registrations.opening_time,Registrations.closing_time,Registrations.business_name,Registrations.tagline,Registrations.website,'+
                 'Registrations.phone_no,Registrations.business_license_no,Registrations.description,Registrations.createdAt,Registrations.updatedAt,'+
                 'Registrations.lat,Registrations.lang,GROUP_CONCAT(UploadImgs.image ORDER BY UploadImgs.image) AS images FROM Registrations LEFT JOIN UploadImgs ON UploadImgs.user_id = Registrations.user_id where Registrations.user_id =:merchant_id';

    models.sequelize.query(query,
        { replacements: replacements, type: models.sequelize.QueryTypes.SELECT }
    ).then(function(merchantDetail) {
        var output = [];
        async.eachSeries(merchantDetail,function(data,callback){ 
         //   getAllImgsMerchant(merchant_id).then(function(imgAll){
            getCouponDetail(coupon_id).then(function(newData){
               // data.images = imgAll;
               if (newData[0].flash_deal == 0){
                   newData[0].flash_deal = false;
               } else if (newData[0].flash_deal == 1){
                   newData[0].flash_deal = true;
               }
                data.coupon_detail = newData[0];
                output.push(data);
                callback();
               
        }, function(err){
            deferred.reject(err);
            
         })
      //  }, function(err){
       //     deferred.reject(err);
       //  })
   
       }, function(err, detail) {
             deferred.resolve(output);
           
       });
        
    });
    return deferred.promise;
};


    





exports.getAllcouponByMerchantId = function(merchant_id){
    var deferred = Q.defer();
    var deferred = Q.defer();
    var replacements = {merchant_id : merchant_id};

    var query =  'select * from Coupons where user_id=:merchant_id and is_deleted=0';

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


var getCouponDetail = exports.getCouponDetail = function(coupon_id){
    var deferred = Q.defer();
    var replacements = {coupon_id : coupon_id};

    var query =  'SELECT Coupons.*,GROUP_CONCAT(UploadImgs.image ORDER BY UploadImgs.image) AS images FROM Coupons LEFT JOIN UploadImgs ON UploadImgs.coupon_id=Coupons.id where Coupons.id=:coupon_id AND Coupons.flash_deal=1';

    models.sequelize.query(query,
        { replacements: replacements, type: models.sequelize.QueryTypes.SELECT }
    ).then(function (coupon) {
        deferred.resolve(coupon);
    },function (err) {
      deferred.reject(err);
    }
);
return deferred.promise;
};






exports.getCouponDetailAdmin = function(coupon_id){
    var deferred = Q.defer();
    var replacements = {coupon_id : coupon_id};

    var query =  'SELECT Coupons.*,GROUP_CONCAT(UploadImgs.image ORDER BY UploadImgs.image) AS images FROM Coupons LEFT JOIN UploadImgs ON UploadImgs.coupon_id=Coupons.id where Coupons.id=:coupon_id';

    models.sequelize.query(query,
        { replacements: replacements, type: models.sequelize.QueryTypes.SELECT }
    ).then(function (coupon) {
        deferred.resolve(coupon);
    },function (err) {
      deferred.reject(err);
    }
);
return deferred.promise;
};


   




exports.getAllcouponByConsumerId = function(consumer_id){
    var deferred = Q.defer();
    var replacements = {consumer_id : consumer_id};

    var query =  'select Coupons.* FROM Coupons LEFT JOIN UsedCoupons ON Coupons.coupon_code=UsedCoupons.coupon_code' +
                ' WHERE Coupons.is_deleted=0 and (Coupons.consumer_id=:consumer_id OR UsedCoupons.consumer_id=:consumer_id)';

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







exports.getAllReq = function(){
    var deferred = Q.defer();
    var replacements = {};
   
    var query = 'SELECT Requests.id as request_id,Requests.detail,Requests.date,Requests.time,Requests.createdAt,Requests.updatedAt,' +
                'Requests.coupon_id,Requests.is_allow,Users.email as consumer_email,SubCategories.name as sub_category_name FROM Requests LEFT JOIN Users' +
                ' ON Requests.consumer_id=Users.id LEFT JOIN SubCategories ON Requests.sub_category_id=SubCategories.id WHERE Requests.is_deleted=0'; 
    
    models.sequelize.query(query,
        { replacements: replacements, type: models.sequelize.QueryTypes.SELECT }
    ).then(function(reqDetail) {
        deferred.resolve(reqDetail);


        });

    
    return deferred.promise;
};



exports.allowRequest = function(request_id){
    var deferred = Q.defer();
                models.Requests.update({
                    is_allow: 1
                },{
                    where: {
                        id: request_id
                    }
                }).then(function(added) {
                    var output = [];
                    getUserDetailsFormReq(request_id).then(function(userDetail){
                        getMerchantIdsBySubCate(userDetail.sub_category_id).then(function(ids) {   
                            async.eachSeries(ids,function(data,callback){
                                userService.getTokenFromdb(data.user_id).then(function(newData){
                                    data = [];
                                    data = newData.token;
                                    output.push(data);
                                    callback();
                               
                                    admin.messaging().sendToDevice(output, notificationConsts.NOTIFICATION__CONSTS.create_request, notificationConsts.NOTIFICATION__CONSTS.options).then(function(response) {
                                        console.log("successfully send multiple message", response);
                
                                    })
                                    .catch(function(error) {
                                        console.log("error send message", error);
                                    })
                                },function(err){
                                    deferred.reject(err)
                                })
                            }, function(err, detail) {
                               // console.log(output);
                               
                            });
                           
                        userService.getTokenFromdb(userDetail.consumer_id).then(function(newData){
                        admin.messaging().sendToDevice(newData.token, notificationConsts.NOTIFICATION__CONSTS.request_approved, notificationConsts.NOTIFICATION__CONSTS.options).then(function(response) {
                            console.log("successfully send single message", response);
                            deferred.resolve(added);
    
                        })
                        .catch(function(error) {
                            console.log("error send message", error);
                        })
                    },function(err){
                        deferred.reject(err)
                    })
                       
                },function(err){
                    deferred.reject(err)
                    });

                },function(err){
                    deferred.reject(err)
                })
            },function(err){
                deferred.reject(err)
            });
                

    return deferred.promise;
};


/*var output = [];
async.eachSeries(allcoupons,function(data,callback){ 
    getAllImgsMerchant(data.user_id).then(function(newData){
        data.merchant_images = newData;
        output.push(data);
        callback();
    }, function(err){
       deferred.reject(err);
    })

}, function(err, detail) {
     deferred.resolve(output);
   
}); */



exports.rejectRequest = function(request_id){
    var deferred = Q.defer();
                models.Requests.update({
                    is_allow: 0
                },{
                    where: {
                        id: request_id
                    }
                }).then(function(reject) {
                    getUserDetailsFormReq(request_id).then(function(userDetail){
                    userService.getTokenFromdb(userDetail.consumer_id).then(function(newData){
                    admin.messaging().sendToDevice(newData.token, notificationConsts.NOTIFICATION__CONSTS.request_reject, notificationConsts.NOTIFICATION__CONSTS.options).then(function(response) {
                        console.log("successfullee send message", response);
                        //console.log(response.results[0].error);
                        deferred.resolve(reject);

                    })
                    .catch(function(error) {
                        console.log("error send message", error);
                    })
                },function(err){
                    deferred.reject(err)
                })
            },function(err){
                deferred.reject(err)
            })
                },function(err){
                    deferred.reject(err)
                });
                

    return deferred.promise;
};



var getUserDetailsFormReq = function (request_id) {
    var deferred = Q.defer();
    models.Requests.findOne({
        where: {
            id: request_id
        }
    }).then(function (detail) {
            deferred.resolve(detail);
        },function (err) {
          deferred.reject(err);
        }
    );
    return deferred.promise;
};






