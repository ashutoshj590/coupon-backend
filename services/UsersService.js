var models = require('../models/index.js');
var util = require('../lib/Utils.js');
//var redis = require('../lib/redis.js');
var Q = require('q');
var consts = require('../lib/consts.js');
var config = consts.parsedConfig;
let userDOA = require('../doa/user');
let commonFuncs = require('../utils/commonFuncs');
let httpError = require('../errors/httpError');
let httpStatusCodes = require('../constants/httpStatusCodes');
var sessionTime = 1 * 60 * 60 * 1000;
let fbServices = require('./fbServices');
let responseConstants = require('../constants/responseConst');
let constants = require('../lib/consts');
var bcrypt = require('bcrypt');
const { response } = require('express');


/*
 * Find a user by email. If does not exist, then create one.
 * todo: validations for mandatory fields.
 * Returns a promise
 */
module.exports.createNewUser = (user) => {
    let { User } = models;
    let { email, type, password, token } = user;
    return userDOA.findUserByEmail(email)
        .then((foundUser) => {
            if (foundUser == null || foundUser == undefined) {
                //create  
                return commonFuncs.encrypt(password)
                    .then((hashed) => {
                        user.password = hashed;
                         return userDOA.createUser(user)
                       /*     .then((user) => {
                                return saveOTPForUser(user.id, consts.OTP_TYPE.verify_email, user.email, user.type);
                        }); */
                })
                .then(() => {
                    return util.getResponseObject(constants.RESPONSE_SUCCESS);
                })
            } else {
                throw new httpError(httpStatusCodes.OK, { response: 'User already exists' });
            }
        })
        .catch((err) => {
            return Promise.reject(err);
        });
}

module.exports.login = (user, session) => {
    let { email, password, type, token } = user;
 //   if (token) {
   //     return handleFBLoginAndSignUp(token, session);
  //  }
    return userDOA.findUserByEmailAndType(email, type)
        .then((user) => {
            if (user == null) {
                throw new httpError(httpStatusCodes.UNAUTHORIZED, { response: 'Not able to find user' });
            }
            return commonFuncs
                .compare(password, user.password)
                .then(() => {
                    return user;
                }, () => {
                    throw new httpError(httpStatusCodes.UNAUTHORIZED, { response: 'Password incorrect !' });
                })
                .then(() => {
                  return util.refreshSession(session, user, sessionTime);
                
                 
                })
                .then(() => {
                    return util.getResponseObject(constants.RESPONSE_SUCCESS, 'Logged in');
                })
                .catch((err) => {
                    return Promise.reject(err);
                })
        });
} 




/*
 * Basic DB call. Find store details of user.
 */
var findUsers = exports.findUsers = function(userId){
    var deferred = Q.defer();
    models.Users.findAll({
        where: {
            user_id: userId,
        }
    }).then(function(allusers) {
        deferred.resolve(allusers);
    }, function(err){
        deferred.reject(err)
    });
    return deferred.promise;
};


/*
*   Function for create Merchant Details for Registration..................
*/
exports.createMerchantDetail = function(userId, address, city, state, zipcode, openingTime, closingTime, businessName, tagline, website, phoneNo, businessLNo, discription, categoryId, subCategoryId){
    var deferred = Q.defer();
    models.Registration.create({
        user_id: userId,
        address: address,
        city: city,
        state: state,
        zipcode: zipcode,
        opening_time: openingTime,
        closing_time: closingTime,
        business_name: businessName,
        tagline: tagline,
        website: website,
        phone_no: phoneNo,
        business_license_no: businessLNo,
        discription: discription,
        category_id: categoryId,
        sub_category_id: subCategoryId
    }).then(function(merchantDetail) {
        deferred.resolve(merchantDetail);
    },function(err){
        deferred.reject(err)
    });
    return deferred.promise;
};


exports.uploadImageToDatabase = function (user_id, imgObject) {
   //var deferred = Q.defer();
    for(var i=0; i< imgObject.length; i++){
        console.log("loop for the check images are in ary or not..........////////");
        console.log(imgObject[i]);
        models.UploadImgs.create({
            user_id: user_id,
            image: imgObject[i]
        })
    }
    console.log(imgObject);
    return  imgObject;
        
};









