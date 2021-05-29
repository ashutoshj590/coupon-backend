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
var async = require('async');

/*
 * Find a user by email. If does not exist, then create one.
 * todo: validations for mandatory fields.
 * Returns a promise
 */
module.exports.createNewUser = (user) => {
    let { User } = models;
    let { email, password } = user;
    user.type = "consumer";
    user.is_registered = 0;
    return userDOA.findUserByEmail(email)
        .then((foundUser) => {
            if (foundUser == null || foundUser == undefined) {
                //create 
                createLoginData(user.email,user.password).then(function(data){ 
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
            },function(err){
                deferred.reject(err)
            });
            } else {
                throw new httpError(httpStatusCodes.OK, { response: 'User already exists' });
            }
        })
        .catch((err) => {
            return Promise.reject(err);
        });
}


var createLoginData = function(email,user_data){
    var deferred = Q.defer();
    models.UserLoginData.create({
        email: email,
        user_data: user_data

    }).then(function(user) {
        deferred.resolve(user);
    },function(err){
        deferred.reject(err)
    });
    return deferred.promise;
};



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



module.exports.googleLogin = (user) => {
    let { User } = models;
    let { email, google_id } = user;
    user.type = "consumer";
    user.is_registered = 0;
    return userDOA.findUserByGoogleId(google_id)
        .then((foundUser) => {
            if (foundUser == null || foundUser == undefined) {
                //create 
                return userDOA.createUser(user)   
                .then(() => {
                    return userDOA.findUserByGoogleId(google_id)
                    .then((user) => {
                        return user;
                   
                    })
                })
       
            } else {
                return userDOA.findUserByGoogleId(google_id)
                    .then((user) => {
                        return user;
                   
                    })
                    .catch((err) => {
                        return Promise.reject(err);
                    })
                    
            }
        })
        .catch((err) => {
            return Promise.reject(err);
        });
}



module.exports.facebookLogin = (user) => {
    let { User } = models;
    let { email, fb_id } = user;
    user.type = "consumer";
    return userDOA.findUserByFbId(fb_id)
        .then((foundUser) => {
            if (foundUser == null || foundUser == undefined) {
                //create 
                return userDOA.createUser(user)   
                .then(() => {
                    return userDOA.findUserByFbId(fb_id)
                    .then((user) => {
                        return user;
                   
                    })
                })
       
            } else {
                return userDOA.findUserByFbId(fb_id)
                    .then((user) => {
                        return user;
                   
                    })
                    .catch((err) => {
                        return Promise.reject(err);
                    })
                    
            }
        })
        .catch((err) => {
            return Promise.reject(err);
        });
}





/*
*   Function for create Merchant Details for Registration..................
*/
exports.createMerchantDetail = function(userId, address, city, state, zipcode, openingTime, closingTime, businessName, tagline, website, phoneNo, businessLNo, description, subCategoryId, notification_email, lat, lang){
    var deferred = Q.defer();
    foudUserById(userId).then(function(user){
       if (user != null || undefined || 0){
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
        lang: lang,
        status: 1
    }).then(function(merchantDetail) {
        var cateArray = merchantDetail.sub_category_id.split(",");
        addSubCatetoMap(userId, cateArray, lat, lang).then(function(added){
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
var addSubCatetoMap = function(user_id,sub_category_id, lat, lang){
    var deferred = Q.defer();
    for(var i=0; i< sub_category_id.length; i++){
        models.UserSubCateMap.create({
            user_id: user_id,
            sub_category_id: sub_category_id[i],
            lat: lat,
            lang: lang
       
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


var updateIsRegisterFalse = function(user_id){
    var deferred = Q.defer();
        models.User.update({
            is_registered: 0
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


exports.deleteConsumerById = function(user_id){
    var deferred = Q.defer();
    var replacements = {user_id : user_id};

    var query = 'delete from Users where id=:user_id';

    models.sequelize.query(query,
        { replacements: replacements, type: models.sequelize.QueryTypes.DELETE }
    ).then(function(deleted) {
        deferred.resolve(deleted);

        }
    );
    return deferred.promise;
    
};



exports.deleteMerchantById = function(user_id){
    var deferred = Q.defer();
    var replacements = {user_id : user_id };

    var query = 'delete from Registrations where user_id=:user_id';

    models.sequelize.query(query,
        { replacements: replacements, type: models.sequelize.QueryTypes.DELETE }
    ).then(function(deleted) {   
        deleteMerchantSubCate(user_id).then(function(update){
            updateIsRegisterFalse(user_id).then(function(updated){
            deferred.resolve(deleted);
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


var deleteMerchantSubCate = function(user_id){
    var deferred = Q.defer();
    var replacements = { user_id : user_id };

    var query = 'delete from UserSubCateMaps where user_id=:user_id';

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
        var output = [];
        async.eachSeries(result,function(data,callback){ 
            getAllcouponByMerchantId(data.user_id).then(function(newData){
                data.coupons_detail = newData;
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






vat = getAllcouponByMerchantId = function(merchant_id){
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



exports.saveOTPForUser = function(email){
    var deferred = Q.defer();
    
    userDOA.findUserByEmail(email).then(function(user){
        foudUserDataByEmail(email).then(function(found){
            if(user == null || undefined){
                deferred.reject("No user found with given email id.");
            }else {
            if (found.email === user.email){
                var passwordData = found.user_data;
            }
        let mailOptions = {
            from: "bdappashu123@gmail.com",
            to: email,
            subject: "Forgot password",
            text: "Your password is:- " + passwordData
        }; 
           
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
        }, function(err){
            deferred.reject(err);
        })
   
    return deferred.promise;
};


var foudUserDataByEmail = function(email){
    var deferred = Q.defer();
    models.UserLoginData.findOne({
        where: {
            email: email
        }
    }).then(function (found) {
            deferred.resolve(found);
        },function (err) {
          deferred.reject(err);
        }
    );
    return deferred.promise;
};



exports.getAllMerchant = function(){
    var deferred = Q.defer();
    var replacements = null;

    var query =  'SELECT Registrations.*, MAX(UserSubCateMaps.createdAt) as sub_cat_created ,Users.email, GROUP_CONCAT(UploadImgs.image ORDER BY UploadImgs.image) AS images ' +
                'FROM UserSubCateMaps LEFT JOIN Registrations ON Registrations.user_id = UserSubCateMaps.user_id LEFT JOIN UploadImgs ON UploadImgs.user_id = Registrations.user_id ' +
                'LEFT JOIN Users ON Users.id = Registrations.user_id GROUP BY Registrations.id';


    models.sequelize.query(query,
        { replacements: replacements, type: models.sequelize.QueryTypes.SELECT }
    ).then(function(data) {
        deferred.resolve(data);

        }
    );
    return deferred.promise;
};


exports.getAllConsumer = function(){
    var deferred = Q.defer();
    var replacements = null;

    var query =  'SELECT * from Users where Users.type = "consumer"';

    models.sequelize.query(query,
        { replacements: replacements, type: models.sequelize.QueryTypes.SELECT }
    ).then(function(data) {
        deferred.resolve(data);

        }
    );
    return deferred.promise;
};


exports.getAllMerchantImages = function(merchant_id){
    var deferred = Q.defer();
    var replacements = {merchant_id : merchant_id};

    var query =  'SELECT * from UploadImgs where UploadImgs.user_id =:merchant_id';

    models.sequelize.query(query,
        { replacements: replacements, type: models.sequelize.QueryTypes.SELECT }
    ).then(function(data) {
        deferred.resolve(data);

        }
    );
    return deferred.promise;
};


exports.changeStatustoMerchant = function(merchant_id){
    var deferred = Q.defer();
    findMerchant(merchant_id).then(function(foundData) {
            if (foundData.status == 1 || foundData.status == null) {
                models.Registration.update({
                    status: 0
                },{
                    where: {
                        user_id: merchant_id
                    }
                }).then(function(added) {
                    deferred.resolve(added);
                },function(err){
                    deferred.reject(err)
                });
            } else if (foundData.status == 0 || foundData.status == null) {
                models.Registration.update({
                    status: 1
                },{
                    where: {
                        user_id: merchant_id
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




var findMerchant = function(merchant_id){
    var deferred = Q.defer();
    var cond={
                "user_id": merchant_id
        };
    models.Registration.findOne({
        where: cond
    }).then(function (result) {
            deferred.resolve(result);
        },function (err) {
            deferred.reject(err);
        }
    );
    return deferred.promise;
};



exports.addToBlock = function(consumer_id, merchant_id){
    var deferred = Q.defer();
    models.BlockMerchants.create({
        consumer_id: consumer_id,
        merchant_id: merchant_id,
        is_blocked: 1
        
    }).then(function(blocked) {
        deferred.resolve(blocked);
    },function(err){
        deferred.reject(err)
    });
    return deferred.promise;
};