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
const { response } = require('express');
var reporting = require('../models/reportingIndex.js');




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
    models.SubCategory.create({
        category_id: category_id,
        name: name,
        img_url: imgUrl.path,
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
var getSubcategory = exports.getSubcategory = function(categoryId){
    var deferred = Q.defer();
    models.SubCategory.findAll({
        where: {
            category_id: categoryId,
            is_deleted: 0
            }
    }).then(function (subCategories) {
          //  util.addS3BucketBaseUrl(allCategories, 'thumb_url', function(result){
                deferred.resolve(subCategories);
          //  });
        },function (err) {
          deferred.reject(err);
        }
    );
    return deferred.promise;
};




exports.getAllcategoryData = function(){
    var deferred = Q.defer();
    var replacements = null;
    var query = 'select SubCategories.id,SubCategories.name,SubCategories.img_url,Categories.id as category_id,Categories.name as' +
                ' category_name from SubCategories LEFT JOIN Categories on SubCategories.category_id=Categories.id where SubCategories.is_deleted=0;'
               
    models.sequelize.query(query,
        { replacements: replacements, type: models.sequelize.QueryTypes.SELECT }
        ).then(function(result) {
            var testData = [];
            result.forEach(function(data, index){
                countsForMerchant(data.id).then(function(counts){
                   // console.log(counts[0].merchant_count);
                  //  data.merchantCounts = counts[0].merchant_count;
                 //   testData.push(data);
                    deferred.resolve(result);

            }, function(err){
                deferred.reject(err);
            })
            })
        });
        return deferred.promise;
    };



var countsForMerchant = function(sub_category_id){
    var deferred = Q.defer();
    var replacements = {sub_category_id : sub_category_id};
    var query = 'select COUNT(*) as merchant_count from UserSubCateMaps where sub_category_id=:sub_category_id';
    models.sequelize.query(query,
        { replacements: replacements, type: models.sequelize.QueryTypes.SELECT }
    ).then(function(counts) {
            deferred.resolve(counts);
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