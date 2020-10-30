var models = require('../models/index.js');
var util = require('../lib/Utils.js');
var Q = require('q');
let userDOA = require('../doa/user');
let commonFuncs = require('../utils/commonFuncs');
let httpError = require('../errors/httpError');
let httpStatusCodes = require('../constants/httpStatusCodes');
var sessionTime = 1 * 60 * 60 * 1000;
let constants = require('../lib/consts');
const { response } = require('express');
const nodemailer = require('nodemailer');
require('dotenv').config();

/*
 * Find a user by email. If does not exist, then create one.
 * todo: validations for mandatory fields.
 * Returns a promise
 */
module.exports.createNewUser = (user) => {
    let { User } = models;
    let { email, type, password, token } = user;
    user.type = "consumer";
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
    let { email, password } = user;
    return userDOA.findUserByEmail(email)
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
exports.createMerchantDetail = function(userId, address, city, state, zipcode, openingTime, closingTime, businessName, tagline, website, phoneNo, businessLNo, description, subCategoryId, notification_email, lat, lang){
    var deferred = Q.defer();
    foudUserById(userId).then(function(user){
       if (user != null || undefined){
           if(user.dataValues.user_id === userId) {
        deferred.reject("user already registered !")
           }  
       } else {
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
        description: description,
        sub_category_id: subCategoryId,
        notification_email: notification_email,
        lat: lat,
        lang: lang
    }).then(function(merchantDetail) {
        var cateArray = merchantDetail.sub_category_id.split(",");
        addSubCatetoMap(userId, cateArray).then(function(added){
        updateIsRegister(userId).then(function(user){
            udpateMerchantType(userId).then(function(user){
              deferred.resolve(merchantDetail);
            }, function(err){
                deferred.reject(err);
            })    

        }, function(err){
            deferred.reject(err);
        })

    }, function(err){
        deferred.reject(err);
    })

    },function(err){
        deferred.reject(err)
    });
}
},function(err){
    deferred.reject(err)
});
    return deferred.promise;
};


/* function for add sub_Cate_id in maping table....*/
var addSubCatetoMap = function(user_id,sub_category_id){
    var deferred = Q.defer();
    for(var i=0; i< sub_category_id.length; i++){
        models.UserSubCateMap.create({
            user_id: user_id,
            sub_category_id: sub_category_id[i]
       
        }).then(function (added) {
            deferred.resolve(added);
        }, function (err) {
            deferred.reject(err)
        });
    }
    return deferred.promise;
}

/* function for udpate user type for merchant...*/
var udpateMerchantType = function(user_id){
    var deferred = Q.defer();
    models.User.update({
        type: "merchant,consumer"
    }, {
        where: {id: user_id}
        }).then(function (added) {
            deferred.resolve(added);
        }, function (err) {
            deferred.reject(err)
        });
    return deferred.promise;
}


/*  function for updated get data for sub_category_id */
var foudUserById = function(user_id){
    var deferred = Q.defer();
    models.Registration.findOne({
        where: {
            user_id: user_id
        }
    }).then(function (userfound) {
            deferred.resolve(userfound);
        },function (err) {
          deferred.reject(err);
        }
    );
    return deferred.promise;
};



/*
*   Function for create Merchant Details for Registration..................
*/
exports.updateMerchantDetail = function(userId, address, city, state, zipcode, openingTime, closingTime, businessName, tagline, website, phoneNo, businessLNo, description, subCategoryId, notification_email, lat, lang){
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
        description: description,
        sub_category_id: subCategoryId,
        notification_email: notification_email,
        lat: lat,
        lang: lang
    },
     {
        where: {user_id: userId}
    }).then(function(merchantUpdated) {
        getSubCategoryIds(userId).then(function(ids) {
            var cateArray = ids[0].dataValues.sub_category_id.split(",");
            updateSubCatetoMap(userId, cateArray).then(function(update){
              deferred.resolve(merchantUpdated);
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



/*  function for updated get data for sub_category_id */
var getSubCategoryIds = function(user_id){
    var deferred = Q.defer();
    models.Registration.findAll({
        attributes: ['sub_category_id'], 
        where: {
            user_id: user_id
        }
    }).then(function (subCateIdData) {
            deferred.resolve(subCateIdData);
        },function (err) {
          deferred.reject(err);
        }
    );
    return deferred.promise;
};




/* function for update sub_Cate_id in maping table....*/
var updateSubCatetoMap = function(user_id, sub_category_id){
    var deferred = Q.defer();
        models.UserSubCateMap.destroy({
                where: {
                user_id: user_id
                }
        }).then(function (updated) {
            for(var i=0; i< sub_category_id.length; i++){
                models.UserSubCateMap.create({
                    user_id: user_id,
                    sub_category_id: sub_category_id[i]
               
                }).then(function (added) {
                    deferred.resolve(added);
                }, function (err) {
                    deferred.reject(err)
                });
            }
        }, function (err) {
            deferred.reject(err)
        });
    return deferred.promise;
}





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



/*exports.uploadImageToDatabase = function (user_id, imgObject) {
    //var deferred = Q.defer();
     for(var i=0; i< imgObject.length; i++){
         models.UploadImgs.create({
             user_id: user_id,
             image: imgObject[i].path,
             is_deleted: 0
         })
     }
     console.log(imgObject);
     return  imgObject;
         
 }; */

 exports.uploadImageToDatabase = function (user_id, imgObject) {
    var deferred = Q.defer();
    imgObject.forEach(function (image, index) {
        models.UploadImgs.create({
            user_id: user_id,
            image: image.path,
            is_deleted: 0
        }).then(function (data) {
            deferred.resolve(data);
        }, function (err) {
            deferred.reject(err)
        });
 })
    return deferred.promise;
}





exports.deleteImageById = function(user_id, image_id){
    var deferred = Q.defer();
    var replacements = {user_id : user_id, image_id : image_id };

    var query = 'delete from UploadImgs where user_id=:user_id and id=:image_id';

    models.sequelize.query(query,
        { replacements: replacements, type: models.sequelize.QueryTypes.DELETE }
    ).then(function(deleted) {
        deferred.resolve(deleted);

        }
    );
    return deferred.promise;
};




exports.getMerchantDetail = function(user_id){
    var deferred = Q.defer();
    var replacements = {user_id : user_id};
    var query = 'select Registrations.user_id as user_id, Registrations.address,Registrations.city,Registrations.state,Registrations.zipcode,Registrations.business_name,Registrations.tagline,Registrations.website,Registrations.phone_no,Registrations.business_license_no,Registrations.description,Registrations.opening_time,Registrations.closing_time,' +
                'Registrations.notification_email,Registrations.sub_category_id,Registrations.lat,Registrations.lang from Registrations where Registrations.user_id=:user_id;'
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
        attributes: ['id','image','user_id'], 
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



/* function for add sub_Cate_id in maping table....*/
exports.addUserFeedback = function(user_id,feedback){
    var deferred = Q.defer();
        models.UserFeedback.create({
            user_id: user_id,
            feedback: feedback
       
        }).then(function (added) {
            deferred.resolve(added);
        }, function (err) {
            deferred.reject(err)
        });
    return deferred.promise;
}





let transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL,
        pass: process.env.PASSWORD
    }

});



exports.saveOTPForUser = function(email, user_type){
    var deferred = Q.defer();
    let mailOptions = {
        from: "bdappashu123@gmail.com",
        to: email,
        subject: "Forgot password",
        text: "Please click on this link :-"
    }; 
    userDOA.findUserByEmailAndType(email,user_type).then(function(user){
            if(user == null){
                deferred.reject("No user found with given email id.");
            }else {
                transporter.sendMail(mailOptions, function(err, data) {
                    if(err){
                        deferred.reject(err);
                    } else {
                        deferred.resolve(data);
                    }
                })
                
            }
        }, function(err){
            deferred.reject(err);
        })
   
    return deferred.promise;
};

