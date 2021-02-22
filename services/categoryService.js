var models = require('../models/index.js');
//var redis = require('../lib/redis.js');
var Q = require('q');
var async = require('async');
var couponService = require('./couponService');



/*
*   Function for Add new Category..................
*/
exports.createCategory = function(name, thumbUrl, status){
    var deferred = Q.defer();
    models.Category.create({
        name: name,
        thumb_url: thumbUrl,
        status: status,
        is_deleted: 0

    }).then(function(Category) {
        deferred.resolve(Category);
    },function(err){
        deferred.reject(err)
    });
    return deferred.promise;
};

/*
* Fuction define for get All category list from database.
*/
exports.getAllcategory = function(){
    var deferred = Q.defer();
    var cond={"is_deleted":0};
    models.Category.findAll({
      where: cond
    }).then(function (allCategories) {
          //  util.addS3BucketBaseUrl(allCategories, 'thumb_url', function(result){
                deferred.resolve(allCategories);
          //  });
        },function (err) {
          deferred.reject(err);
        }
    );
    return deferred.promise;
};

/*
* Function for change status to Category.
*/
exports.changeStatustoCategory = function(category_id){
    var deferred = Q.defer();
        models.Category.update({
            is_deleted: 1
        },{
            where: {
            id: category_id
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
*   Function for Add new Sub Category..................
*/
exports.createSubCategory = function(category_id, name, imgUrl){
    var deferred = Q.defer();
    var path;
    if (imgUrl == null || undefined){
        path = 'public/images/uploaded_images/default.png';
    } else {
        path = imgUrl.path;
    }
    models.SubCategory.create({
        category_id: category_id,
        name: name,
        img_url: path,
        status: 1,
        is_deleted: 0

    }).then(function(subCategory) {
        deferred.resolve(subCategory);
    },function(err){
        deferred.reject(err)
    });
    return deferred.promise;
};


/*
* Fuction define for get sub category list from database.
*/
var getSubcategory = exports.getSubcategory = function(){
    var deferred = Q.defer();
    var replacements = null;

    var query = 'select SubCategories.*,Categories.name as' +
                ' category_name from SubCategories LEFT JOIN Categories on SubCategories.category_id=Categories.id where SubCategories.is_deleted=0';

    models.sequelize.query(query,
        { replacements: replacements, type: models.sequelize.QueryTypes.SELECT }
    ).then(function(subCategories) {
        deferred.resolve(subCategories);

        }
    );
    return deferred.promise;
};





exports.getAllcategoryData = function(lat, lang, consumer_id){
    var deferred = Q.defer();
    var replacements = null;
    var query = 'select SubCategories.id,SubCategories.name,SubCategories.img_url,Categories.id as category_id,Categories.name as' +
                ' category_name from SubCategories LEFT JOIN Categories on SubCategories.category_id=Categories.id where SubCategories.is_deleted=0;'
               
    models.sequelize.query(query,
        { replacements: replacements, type: models.sequelize.QueryTypes.SELECT }
        ).then(function(result) {
            var output = [];
            async.eachSeries(result,function(data,callback){ 
                countsForMerchant(data.id, lat, lang, consumer_id).then(function(counts){
                   data.coupon_count = counts.length;
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



var countsForMerchant = function(sub_category_id, lat1, lon1, consumer_id){
    var deferred = Q.defer();
    var consumerId = consumer_id;
    if(consumerId == null || undefined){
        var replacements = {sub_category_id : sub_category_id};
        var queryset = ''
    } else {
      var replacements = {sub_category_id : sub_category_id, consumer_id : consumer_id};
      var queryset =  ' and NOT EXISTS ( SELECT * FROM UsedCoupons WHERE Coupons.coupon_code=UsedCoupons.coupon_code AND UsedCoupons.consumer_id=:consumer_id )'

    }

      var query = 'select Coupons.*,UserSubCateMaps.user_id,UserSubCateMaps.lat,UserSubCateMaps.lang from Coupons LEFT JOIN UserSubCateMaps' + 
                  ' on Coupons.user_id=UserSubCateMaps.user_id where UserSubCateMaps.sub_category_id=:sub_category_id and Coupons.is_deleted=0 and NOT Coupons.coupon_type="custom" and current_date() <= STR_TO_DATE(Coupons.expiry_date,"%d%M%Y %h%i")' +
                    queryset;
      
    models.sequelize.query(query,
        { replacements: replacements, type: models.sequelize.QueryTypes.SELECT }
    ).then(function(data) {
        var output = [];
        data.forEach(function(obj, index) {
            var unit =  "M";       //commented when value need in miles
            var data = couponService.calculatedistance(lat1, lon1, obj.lat, obj.lang, unit);
           // obj.distance = data;
            if (data <= 10){ 
            output.push(obj);
            }
        })
          deferred.resolve(output);
       
    }
        );
        return deferred.promise;
         

 };





/*
* Function for change status to Sub Category.
*/
exports.changeStatustoSubCategory = function(sub_category_id){
    var deferred = Q.defer();
        models.SubCategory.update({
            is_deleted: 1
        },{
            where: {
            id: sub_category_id
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



/* Function for create admin reports for the CMS */
exports.getAllCountsForConsumer = function(){
    var deferred = Q.defer();
    var replacements = null;

    var query = "select COUNT(*) as consumer from Users WHERE type='consumer'";

    models.sequelize.query(query,
        { replacements: replacements, type: models.sequelize.QueryTypes.SELECT }
    ).then(function(createdCounts) {
        var object = {};
        countsForMerchantAdmin().then(function(commCounts) {
            countsForAllCoupons().then(function(cusCounts) {
                countsForCustom().then(function(usedCounts) {
                    countsForAndroid().then(function(reqCounts) {
                        countsForApple().then(function(appleCounts) {
                            var test1 = createdCounts[0];
                            var test2 = commCounts[0];
                            var test3 = cusCounts[0];
                            var test4 = usedCounts[0];
                            var test5 = reqCounts[0];
                            var test6 = appleCounts[0];
                            
                            Object.keys(test1)[0];
                            Object.keys(test2)[0];
                            Object.keys(test3)[0];
                            Object.keys(test4)[0];
                            Object.keys(test5)[0];
                            Object.keys(test6)[0];
                            var key1 = Object.keys(test1)[0];
                            var key2 = Object.keys(test2)[0];
                            var key3 = Object.keys(test3)[0];
                            var key4 = Object.keys(test4)[0];
                            var key5 = Object.keys(test5)[0];
                            var key6 = Object.keys(test6)[0]; 
                        object.consumer = test1[key1];
                        object.merchant = test2[key2];
                        object.coupons = test3[key3];
                        object.custom = test4[key4];
                        object.android = test5[key5];
                        object.apple = test6[key6];
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
            },function(err){
                deferred.reject(err)
            });
        }
    );
    return deferred.promise;
};




var countsForMerchantAdmin = function(){
    var deferred = Q.defer();
    var replacements = null;
    var query = "select COUNT(*) as merchant from Users WHERE type='merchant,consumer'";

    models.sequelize.query(query,
        { replacements: replacements, type: models.sequelize.QueryTypes.SELECT }
    ).then(function(coummnityCounts) {
        deferred.resolve(coummnityCounts);

        }
    );
    return deferred.promise;
};




var countsForAllCoupons = function(){
    var deferred = Q.defer();
    var replacements = null;

    var query = 'select COUNT(*) as coupons from Coupons';

    models.sequelize.query(query,
        { replacements: replacements, type: models.sequelize.QueryTypes.SELECT }
    ).then(function(customCounts) {
        deferred.resolve(customCounts);

        }
    );
    return deferred.promise;
};



var countsForCustom = function(){
    var deferred = Q.defer();
    var replacements = null;

    var query = 'select COUNT(*) as custom from Coupons WHERE coupon_type="custom"';

    models.sequelize.query(query,
        { replacements: replacements, type: models.sequelize.QueryTypes.SELECT }
    ).then(function(usedCounts) {
        deferred.resolve(usedCounts);

        }
    );
    return deferred.promise;
};



var countsForAndroid = function(){
    var deferred = Q.defer();
    var replacements = null;

    var query = 'select COUNT(*) as android from Users where device_type="android"';

    models.sequelize.query(query,
        { replacements: replacements, type: models.sequelize.QueryTypes.SELECT }
    ).then(function(usedCounts) {
        deferred.resolve(usedCounts);

        }
    );
    return deferred.promise;
};


var countsForApple = function(){
    var deferred = Q.defer();
    var replacements = null;

    var query = 'select COUNT(*) as apple from Users where device_type="apple"';

    models.sequelize.query(query,
        { replacements: replacements, type: models.sequelize.QueryTypes.SELECT }
    ).then(function(usedCounts) {
        deferred.resolve(usedCounts);

        }
    );
    return deferred.promise;
};





exports.changeStatustoCategory = function(sub_category_id){
    var deferred = Q.defer();
    findSubCategory(sub_category_id).then(function(foundData) {
            if (foundData.status == 1 || foundData.status == null) {
                models.SubCategory.update({
                    status: 0
                },{
                    where: {
                        id: sub_category_id
                    }
                }).then(function(added) {
                    deferred.resolve(added);
                },function(err){
                    deferred.reject(err)
                });
            } else if (foundData.status == 0 || foundData.status == null) {
                models.SubCategory.update({
                    status: 1
                },{
                    where: {
                        id: sub_category_id
                    }
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




var findSubCategory = function(sub_category_id){
    var deferred = Q.defer();
    var cond={
                "id": sub_category_id
        };
    models.SubCategory.findOne({
        where: cond
    }).then(function (result) {
            deferred.resolve(result);
        },function (err) {
            deferred.reject(err);
        }
    );
    return deferred.promise;
};
