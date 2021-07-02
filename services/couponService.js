var models = require('../models/index.js');
//var redis = require('../lib/redis.js');
var Q = require('q');
var async = require('async');
var uniqid = require('uniqid');


/*
*   Function for create coupon .................
*/
var createCouponForMerchant = exports.createCouponForMerchant = function(user_id,sub_category_id,coupon_type,days,start_time,end_time,expiry_date,flash_deal,description,restriction, shortName, consumerId){
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
        short_name: shortName,
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
var updateCouponForMerchant = exports.updateCouponForMerchant = function(consumer_id,request_id,user_id,coupon_id,sub_cate_id,coupon_type,days,start_time,end_time,expiry_date,flash_deal,description,restriction,shortName,status){
    var deferred = Q.defer();
    if (coupon_type == "community"){
       var endTime = null; 
    } else {
        var endTime = end_time;
    }
    models.Coupons.update({
        sub_category_id: sub_cate_id,
        coupon_type: coupon_type,
        days: days,
        start_time: start_time,
        end_time: endTime,
        expiry_date: expiry_date,
        flash_deal: flash_deal,
        description: description,
        restriction: restriction,
        short_name: shortName,
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
        deferred.resolve(couponUpdate);
    
        },function(err){
            deferred.reject(err)
            });
        } else {
            deferred.resolve(couponUpdate);
        }
    },function(err){
        deferred.reject(err)
    });
    return deferred.promise;
};



exports.updateCustomCouponForMerchant = function(user_id,coupon_id,days,start_time,end_time,expiry_date,flash_deal,description,restriction,shortName){
    var deferred = Q.defer();
    models.Coupons.update({
        days: days,
        start_time: start_time,
        end_time: end_time,
        expiry_date: expiry_date,
        flash_deal: flash_deal,
        description: description,
        restriction: restriction,
        short_name: shortName,
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
    var merchantID = merchant_id;
    if (merchantID == null){
        var replacements = {};
        var querySet = ''

    } else {
    var replacements = {merchant_id : merchant_id};
    var querySet = ' AND user_id=:merchant_id'
    }
    var query = 'select * from Coupons where is_deleted=0' + querySet;
    

    models.sequelize.query(query,
        { replacements: replacements, type: models.sequelize.QueryTypes.SELECT }
    ).then(function(allcoupons) {
        var data = [];
        allcoupons.forEach(function(coupon, index){
         
            if(coupon.coupon_type == "community"){
                coupon.end_time =null;
            }
            data.push(coupon);
            
        })
        deferred.resolve(data);


        }
    );
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
        is_deleted: 0
        
    }).then(function(requestDetail) {
        var obj = {};
        createCouponForMerchant(null,sub_category_id,"custom",null,null,null,null,null,null,null,null,consumer_id).then(function(result) {
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
                'Requests.date,Requests.time,Requests.coupon_id,Users.email from Requests LEFT JOIN Users ON Requests.consumer_id=Users.id' +
                ' where Requests.merchant_id=:merchant_id and NOT EXISTS (select * from AcceptRequests where Requests.id=AcceptRequests.request_id)';
    
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


exports.getMerchantDetailbySubCateId = function(sub_category_id, consumer_id, lat1, lon1){
    var deferred = Q.defer();
    var replacements = {sub_category_id : sub_category_id, consumer_id : consumer_id};
    
    var query = 'SELECT Registrations.*, MAX(UserSubCateMaps.createdAt) as sub_cat_created , GROUP_CONCAT(UploadImgs.image ORDER BY UploadImgs.image) AS images ' +
                'FROM UserSubCateMaps LEFT JOIN Registrations ON Registrations.user_id = UserSubCateMaps.user_id LEFT JOIN UploadImgs ON UploadImgs.user_id = Registrations.user_id ' +
                 'WHERE UserSubCateMaps.sub_category_id=:sub_category_id GROUP BY Registrations.id';
                
    models.sequelize.query(query,
        { replacements: replacements, type: models.sequelize.QueryTypes.SELECT }
        ).then(function(result) {
            var output = [];    
           // deferred.resolve(result);
           async.eachSeries(result,function(data,callback){ 
            getAllcouponByUserId(data.user_id, consumer_id).then(function(foundData){
               data.couponDetail = foundData;
               output.push(data);
               callback();
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
            if (data <= 10){ 
            output1.push(obj);
            }
        })
          deferred.resolve(output1);   
          // deferred.resolve(result);
       });
                 
            }
        );
        return deferred.promise;
    };


/*exports.getAllmerchantBySerach = function(search_query, consumer_id){
  var searchQuery = search_query+'%';
var deferred = Q.defer();
var replacements = {search_query : searchQuery};

var query = 'SELECT Registrations.*, MAX(UserSubCateMaps.createdAt) as sub_cat_created , GROUP_CONCAT(UploadImgs.image ORDER BY UploadImgs.image) AS images ' +
                'FROM UserSubCateMaps LEFT JOIN Registrations ON Registrations.user_id = UserSubCateMaps.user_id LEFT JOIN UploadImgs ON UploadImgs.user_id = Registrations.user_id ' +
                'where Registrations.business_name like :search_query OR Registrations.address like :search_query GROUP BY Registrations.id';

            
models.sequelize.query(query,
    { replacements: replacements, type: models.sequelize.QueryTypes.SELECT }
    ).then(function(result) {
        var output = [];    
    async.eachSeries(result,function(data,callback){ 
        getAllcouponByUserId(data.user_id, consumer_id).then(function(foundData){
         data.couponDetail = foundData;
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
}; */


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
                'Coupons.expiry_date,Coupons.flash_deal,Coupons.description,Coupons.restriction,Coupons.createdAt,Coupons.updatedAt,Coupons.short_name,Coupons.coupon_code,' +
                'Registrations.business_name as merchant_name,Registrations.lat,Registrations.lang from Coupons LEFT JOIN Registrations ON Coupons.user_id=Registrations.user_id' +
                '  where NOT Coupons.coupon_type="custom" AND Coupons.is_deleted=0 AND ( Coupons.short_name like :search_query OR Coupons.description like :search_query )' + querySet;
              
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




var getAllcouponByUserId = exports.getAllcouponByUserId = function(merchant_id, consumer_id){
    var deferred = Q.defer();
    var replacements = {merchant_id : merchant_id, consumer_id : consumer_id};

    var query = 'SELECT Coupons.id as coupon_id,Coupons.user_id as merchant_id,Coupons.coupon_type,Coupons.days,Coupons.start_time,Coupons.end_time,' +
                'Coupons.expiry_date,Coupons.flash_deal,Coupons.description,Coupons.restriction,Coupons.short_name,Coupons.coupon_code FROM Coupons WHERE NOT EXISTS' +
                ' ( SELECT * FROM UsedCoupons WHERE Coupons.coupon_code=UsedCoupons.coupon_code AND ' +
                'UsedCoupons.consumer_id=:consumer_id ) AND NOT EXISTS ( SELECT * from BlockMerchants WHERE Coupons.id=BlockMerchants.merchant_id AND BlockMerchants.is_blocked=1 ) AND Coupons.user_id=:merchant_id AND NOT Coupons.coupon_type="custom" AND Coupons.is_deleted=0 ORDER BY Coupons.coupon_code ASC';

    models.sequelize.query(query,
        { replacements: replacements, type: models.sequelize.QueryTypes.SELECT }
    ).then(function(data1) {
        var output = [];
        async.eachSeries(data1,function(data,callback){ 
            data.is_fav = false;
            findFavCoupons(consumer_id, data.merchant_id, data.coupon_id).then(function(foundData){
               if (foundData != null || undefined){
                   if (foundData.consumer_id == consumer_id && foundData.merchant_id == data.merchant_id && foundData.coupon_id == data.coupon_id && foundData.is_fav == 1) {
                       data.is_fav = true;
                      
                   } else if (foundData.consumer_id == consumer_id && foundData.merchant_id == data.merchant_id && foundData.coupon_id == data.coupon_id && foundData.is_fav == 0) {
                       data.is_fav = false;
                      
                   }
               }
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
        deferred.resolve(couponUsed);
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
                ' LEFT JOIN FavMerchants on Registrations.user_id=FavMerchants.merchant_id LEFT JOIN UploadImgs ON UploadImgs.user_id = Registrations.user_id WHERE FavMerchants.is_fav=1' +
                ' and FavMerchants.consumer_id=:consumer_id GROUP BY Registrations.id';

    models.sequelize.query(query,
        { replacements: replacements, type: models.sequelize.QueryTypes.SELECT }
    ).then(function (allCoupons) {
        var output = [];
        async.eachSeries(allCoupons,function(data,callback){ 
            findCategoryName(data.merchant_id).then(function(newData){
                data.category_detail = newData[0];
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




exports.getAllFavouriteCoupons = function(consumer_id){
    var deferred = Q.defer();
    var replacements = {consumer_id : consumer_id};

    var query = 'select Coupons.id as coupon_id,Coupons.user_id as merchant_id,Coupons.coupon_type,Coupons.days,Coupons.start_time,Coupons.end_time,Coupons.expiry_date,' +
                ' Coupons.flash_deal,Coupons.description,Coupons.restriction,Coupons.createdAt,Coupons.updatedAt,Coupons.short_name,Coupons.coupon_code,' + 
                'GROUP_CONCAT(UploadImgs.image ORDER BY UploadImgs.image) AS images FROM Coupons LEFT JOIN FavCoupons' +
                ' on Coupons.id=FavCoupons.coupon_id LEFT JOIN UploadImgs ON UploadImgs.user_id = Coupons.user_id WHERE FavCoupons.is_fav=1 and FavCoupons.consumer_id=:consumer_id GROUP BY Coupons.id';

    models.sequelize.query(query,
        { replacements: replacements, type: models.sequelize.QueryTypes.SELECT }
    ).then(function(allcps) {
        deferred.resolve(allcps);

        }
    );
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
                'Coupons.expiry_date,Coupons.description,Coupons.restriction,Coupons.short_name,Coupons.coupon_code' + 
                ' from Coupons left join UsedCoupons on Coupons.coupon_code=UsedCoupons.coupon_code where UsedCoupons.consumer_id=:consumer_id';
    

    models.sequelize.query(query,
        { replacements: replacements, type: models.sequelize.QueryTypes.SELECT }
    ).then(function(usedCounts) {
        var output = [];
            async.eachSeries(usedCounts,function(data,callback){ 
                getAllImgsMerchant(data.merchant_id).then(function(newData){
                    getMerchantDetail(data.merchant_id).then(function(newData1){
                    data.merchant_images = newData;
                    data.merchant_detail = newData1;
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
            
        });
        return deferred.promise;
    };



var getAllImgsMerchant = function(merchant_id){
    var deferred = Q.defer();
    var replacements = {merchant_id : merchant_id};

    var query =  'SELECT UploadImgs.image from UploadImgs where UploadImgs.user_id =:merchant_id';

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


    





exports.getAllcouponByMerchantId = function(merchant_id){
    var deferred = Q.defer();
    var cond={
                "user_id": merchant_id,
                "is_deleted": 0
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


exports.getCouponDetail = function(coupon_id){
    var deferred = Q.defer();
    var cond={
                "id": coupon_id
     };
    models.Coupons.find({
      where: cond
    }).then(function (Coupon) {
            deferred.resolve(Coupon);
        },function (err) {
          deferred.reject(err);
        }
    );
    return deferred.promise;
};




exports.getAllcouponByConsumerId = function(consumer_id){
    var deferred = Q.defer();
    var cond={
                "consumer_id": consumer_id,
                "is_deleted": 0
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