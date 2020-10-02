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
*   Function for create Merchant Details for Registration..................
*/
exports.createMerchantDetail = function(userId, address, city, state, zipcode, openingTime, closingTime, businessName, tagline, website, phoneNo, businessLNo, discription, subCategoryId){
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
        sub_category_id: subCategoryId
    }).then(function(merchantDetail) {
        updateIsRegister(userId).then(function(user){
              deferred.resolve(merchantDetail);

        }, function(err){
            deferred.reject(err);
        })
    },function(err){
        deferred.reject(err)
    });
    return deferred.promise;
};


/*
*   Function for create Merchant Details for Registration..................
*/
exports.updateMerchantDetail = function(userId, address, city, state, zipcode, openingTime, closingTime, businessName, tagline, website, phoneNo, businessLNo, discription, subCategoryId){
    var deferred = Q.defer();
    models.Registration.update({
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
        sub_category_id: subCategoryId
    },
     {
        where: {user_id: userId}
    }).then(function(merchantUpdated) {
              deferred.resolve(merchantUpdated);
    },function(err){
        deferred.reject(err)
    });
    return deferred.promise;
};




var updateIsRegister = function(user_id){
    var deferred = Q.defer();
        models.User.update({
            is_registered: 1
        }, {
            where: {id: user_id}
        }).then(function (updated) {
            deferred.resolve(updated);
        }, function (err) {
            deferred.reject(err)
        });
    return deferred.promise;
}


exports.uploadImageToDatabase = function (user_id, imgObject) {
   //var deferred = Q.defer();
    for(var i=0; i< imgObject.length; i++){
        console.log(imgObject[i]);
        models.UploadImgs.create({
            user_id: user_id,
            image: imgObject[i],
            is_deleted: 0
        })
    }
    console.log(imgObject);
    return  imgObject;
        
};


exports.changeStatustoImg = function(user_id, image_id){
    var deferred = Q.defer();
        models.UploadImgs.update({
            is_deleted: 1
        },{
            where: {
            id: image_id,
            user_id: user_id
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


exports.getMerchantDetail = function(user_id){
    var deferred = Q.defer();
    var replacements = {user_id : user_id};
    var query = 'select Registrations.address,Registrations.city,Registrations.state,Registrations.zipcode,Registrations.business_name,Registrations.tagline,Registrations.website,Registrations.phone_no,Registrations.business_license_no,Registrations.description,Registrations.opening_time,Registrations.closing_time' +
                ' from Registrations where Registrations.user_id=:user_id;'
    models.sequelize.query(query,
        { replacements: replacements, type: models.sequelize.QueryTypes.SELECT }
    ).then(function(result) {
            deferred.resolve(result);
        }
    );
    return deferred.promise;
};


exports.getAllImages = function(user_id){
    var deferred = Q.defer();
    models.UploadImgs.findAll({
        attributes: ['image'], 
        where: {
            user_id: user_id,
            is_deleted: 0
        }
    }).then(function (allImgs) {
            deferred.resolve(allImgs);
        },function (err) {
          deferred.reject(err);
        }
    );
    return deferred.promise;
};













