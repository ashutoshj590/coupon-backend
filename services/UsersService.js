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

const axios = require('axios');
const key = process.env.GOOGLE_API_KEY

var admin = require("firebase-admin");
var notificationConsts = require('../constants/notificationConsts');



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
    user.status = 0;
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


var updateStatusUsers = function(email){
    var deferred = Q.defer();
    models.User.increment({
        status: 1
    }, {
        where: {email: email}
        }).then(function (inc) {
            deferred.resolve(inc);
        }, function (err) {
            deferred.reject(err)
        });
    return deferred.promise;
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
                    updateStatusUsers(user.email).then(function(data){ 
                        console.log(user.email);
                    return util.getResponseObject(constants.RESPONSE_SUCCESS, 'Logged in');
                },function(err){
                    deferred.reject(err)
                });
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
            updateSubCatetoMap(userId, cateArray, lat, lang).then(function(update){
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
        console.log(subCateIdData);
            deferred.resolve(subCateIdData);
        },function (err) {
          deferred.reject(err);
        }
    );
    return deferred.promise;
};




/* function for update sub_Cate_id in maping table....*/
var updateSubCatetoMap = function(user_id, sub_category_id, lat, lang){
    var deferred = Q.defer();
        models.UserSubCateMap.destroy({
                where: {
                user_id: user_id
                }
        }).then(function (updated) {
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
            is_registered: 0,
            type: "consumer"
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

 exports.uploadImageToDatabase = function (user_id, imgObject, isFlashDeal, coupon_id) {
    var deferred = Q.defer();
    imgObject.forEach(function (image, index) {
        models.UploadImgs.create({
            user_id: user_id,
            image: image.path,
            is_flash_deal: isFlashDeal,
            coupon_id: coupon_id,
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
    var query = 'select Registrations.user_id, Registrations.address,Registrations.city,Registrations.state,Registrations.zipcode,'+
                'Registrations.business_name,Registrations.tagline,Registrations.website,Registrations.phone_no,Registrations.business_license_no,'+
                'Registrations.description,Registrations.opening_time,Registrations.closing_time,Registrations.notification_email,' +
                'Registrations.sub_category_id,Registrations.lat,Registrations.lang,Users.email,Users.device_type From Registrations'+ 
                ' LEFT JOIN Users ON Registrations.user_id=Users.id where Registrations.user_id=:user_id';
    models.sequelize.query(query,
        { replacements: replacements, type: models.sequelize.QueryTypes.SELECT }
    ).then(function(result) {
        console.log(result);
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




exports.getMerchantDetailAdmin = function(user_id){
    var deferred = Q.defer();
    var replacements = {user_id : user_id};
    var query = 'select Registrations.user_id, Registrations.address,Registrations.city,Registrations.state,Registrations.zipcode,'+
                'Registrations.business_name,Registrations.tagline,Registrations.website,Registrations.phone_no,Registrations.business_license_no,'+
                'Registrations.description,Registrations.opening_time,Registrations.closing_time,Registrations.notification_email,' +
                'Registrations.sub_category_id,Registrations.lat,Registrations.lang,Users.email,Users.device_type From Registrations'+ 
                ' LEFT JOIN Users ON Registrations.user_id=Users.id where Registrations.user_id=:user_id';
    models.sequelize.query(query,
        { replacements: replacements, type: models.sequelize.QueryTypes.SELECT }
    ).then(function(result) {
        var output = [];
        var count = ["A"];
        async.eachSeries(result,function(data,callback){ 
            getAllcouponByMerchantId(data.user_id).then(function(newData){
                categoriesDetail(data.user_id).then(function(cateData){
                    getAllImages(data.user_id).then(function(imgData){
                        usedCouponDetail(data.user_id).then(function(countsUsed){
                            customCouponDetail(data.user_id).then(function(custom){
                                communityCouponDetail(data.user_id).then(function(community){

                data.coupons_detail = newData;
                data.category_detail = cateData;
                data.images = imgData;
                data.flash_coupons = newData.length - (community.length+custom.length);
                data.community_coupons = community.length;
                data.custom_coupons = custom.length;
                data.used_coupons = countsUsed.length;
                output.push(data);
                callback();
         //   }) 

            }, function(err){
                deferred.reject(err);
             })
            }, function(err){
                deferred.reject(err);
             })
            }, function(err){
                deferred.reject(err);
             })
            }, function(err){
                deferred.reject(err);
             })
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




var categoriesDetail = function(merchant_id){
    var deferred = Q.defer();
    var replacements = {merchant_id : merchant_id};

    var query = 'select Registrations.user_id,UserSubCateMaps.sub_category_id,SubCategories.id,SubCategories.name from Registrations left join'+ 
                ' UserSubCateMaps on UserSubCateMaps.user_id=Registrations.user_id left join SubCategories on UserSubCateMaps.sub_category_id=SubCategories.id where Registrations.user_id=:merchant_id';

    models.sequelize.query(query,
        { replacements: replacements, type: models.sequelize.QueryTypes.SELECT }
    ).then(function(coummnityCounts) {
        deferred.resolve(coummnityCounts);

        }
    );
    return deferred.promise;
}; 


var usedCouponDetail = function(merchant_id){
    var deferred = Q.defer();
    var replacements = {merchant_id : merchant_id};

    var query =  'select * from UsedCoupons where merchant_id=:merchant_id';

    models.sequelize.query(query,
        { replacements: replacements, type: models.sequelize.QueryTypes.SELECT }
    ).then(function(dataC) {
        deferred.resolve(dataC);

        }
    );
    return deferred.promise;
}; 


var customCouponDetail = function(merchant_id){
    var deferred = Q.defer();
    var replacements = {merchant_id : merchant_id};

    var query =  'select * from Coupons where coupon_type="custom" and is_deleted=0 and user_id=:merchant_id';

    models.sequelize.query(query,
        { replacements: replacements, type: models.sequelize.QueryTypes.SELECT }
    ).then(function(dataC) {
        deferred.resolve(dataC);

        }
    );
    return deferred.promise;
}; 




var communityCouponDetail = function(merchant_id){
    var deferred = Q.defer();
    var replacements = {merchant_id : merchant_id};

    var query =  'select * from Coupons where coupon_type="community" and is_deleted=0 and user_id=:merchant_id';

    models.sequelize.query(query,
        { replacements: replacements, type: models.sequelize.QueryTypes.SELECT }
    ).then(function(dataC) {
        deferred.resolve(dataC);

        }
    );
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



var getAllImages = exports.getAllImages = function(user_id){
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
            if(user == null || undefined){
                deferred.reject("No user found with given email id.");
            }else {
           
                var otpcode = Math.floor((Math.random()*10000)+1);
               
        let mailOptions = {
            from: "bdappashu123@gmail.com",
            to: email,
            subject: "Forgot password",
            text: "Your OTP is:- " + otpcode,
           // expireIn: new Date().getTime() + 300*1000
        }; 
           
                transporter.sendMail(mailOptions, function(err, data) {
                    if(err){
                        deferred.reject(err);
                    } else {
                        createLoginData(email,otpcode).then(function(data1){ 
                        deferred.resolve(data);
                    }, function(err){
                        deferred.reject(err);
                    })
                    }
                })
                
            }
    
        }, function(err){
            deferred.reject(err);
        })
   
    return deferred.promise;
};


var foudUserDataByOTP = function(otp){
    var deferred = Q.defer();
    models.UserLoginData.findOne({
        where: {
            user_data: otp
        }
    }).then(function (found) {
            deferred.resolve(found);
        },function (err) {
          deferred.reject(err);
        }
    );
    return deferred.promise;
};

/*getToken  from database for notification...........*/
var getTokenFromdb = exports.getTokenFromdb = function (user_id) {
    var deferred = Q.defer();
    models.DeviceToken.findOne({
        where: {
            user_id: user_id
        }
    }).then(function (found) {
            deferred.resolve(found);
        },function (err) {
          deferred.reject(err);
        }
    );
    return deferred.promise;
};




/* function for reset password ........*/
exports.changePasswordForUser = function(otp, new_password, confirm_password){
    var deferred = Q.defer();
    if (confirm_password == new_password){
    foudUserDataByOTP(otp).then(function(user1){
        if (!user1){
            deferred.reject("OTP incorect!");  
        }
                persistNewPassword(user1.email, new_password).then(function(user){
                    getTokenFromdb(user1.id).then(function(newData){
                        if (newData){
                    admin.messaging().sendToDevice(newData.token, notificationConsts.NOTIFICATION__CONSTS.reset_password, notificationConsts.NOTIFICATION__CONSTS.options).then(function(response) {
                        console.log("successfullee send message", response);
                        deferred.resolve("Password Changed");

                    })
                    .catch(function(error) {
                        console.log("error send message", error);
                    })
                } else {
                    console.log("without notifications");
                    deferred.resolve("Password Changed");
                }
                },function(err){
                    deferred.reject(err)
                })
                   
                }, function(err){
                    deferred.reject(err);
                })
            }, function(err){
                deferred.reject("OTP incorrect!!");
            })
        } else {
            deferred.reject("password not match!!");
        }
      
   
    return deferred.promise;
};



/* function for change admin password ........*/
exports.changePasswordForAdmin = function(email, new_password, confirm_password){
    var deferred = Q.defer();
    if (confirm_password == new_password){
        userDOA.findUserByEmail(email).then(function(user1){
        if (!user1){
            deferred.reject("User not found!");  
        }
                persistNewPassword(user1.email, new_password).then(function(user){
                    deferred.resolve("Password Changed");
                }, function(err){
                    deferred.reject(err);
                })
            }, function(err){
                deferred.reject("User not found!");
            })
        } else {
            deferred.reject("password not match!!");
        }
      
   
    return deferred.promise;
};

var persistNewPassword = function(email, new_password){
    var deferred = Q.defer();
    commonFuncs.encrypt(new_password).then(function(hash) {
        models.User.update({
            password: hash
        }, {
            where: {email: email}
        }).then(function (changePassword) {
            deferred.resolve(changePassword);
        }, function (err) {
            deferred.reject(err)
        });
    });
    return deferred.promise;
}







exports.getAllMerchant = function(){
    var deferred = Q.defer();
    var replacements = null;

    var query =  'SELECT Registrations.*,Users.email,Users.createdAt as first_login,Users.updatedAt as last_login,GROUP_CONCAT(UploadImgs.image ORDER BY UploadImgs.image) AS images ' +
                'FROM Registrations LEFT JOIN Users ON Users.id = Registrations.user_id LEFT JOIN UploadImgs ON UploadImgs.user_id = Registrations.user_id GROUP BY Registrations.id';


    models.sequelize.query(query,
        { replacements: replacements, type: models.sequelize.QueryTypes.SELECT }
    ).then(function(merchants) {
        var output = [];
        async.eachSeries(merchants,function(data,callback){
            axios.get('https://maps.googleapis.com/maps/api/geocode/json?latlng='+data.lat+','+data.lang+'&sensor=true&key='+key)
  .then(function (response) {    
      if (response.data.results[0] != null || undefined ){     
       var strData = response.data.results[0].address_components
       for (var i = 0; i < strData.length; i++) {
           if (strData[i].types[0] == "country" ){
               data.country_name = strData[i].long_name;
           }
           if (strData[i].types[0] == "postal_code" ){
            data.zipcode_new = strData[i].long_name;
            }
       }
       data.formatted_address = response.data.results[0].formatted_address
      
    } else {
        data.country_name = '';
        data.zipcode_new = ''; 
        data.formatted_address = '';
    }
            output.push(data);
            callback();
  
  })
  
  .catch(function (error) {
    // handle error
    console.log(error);
  })
  .then(function () {
    // always executed
  });
      
    }, function(err, detail) {
            deferred.resolve(output);
        
    });
    
});
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



exports.addToBlock = function(consumer_id, coupon_id){
    var deferred = Q.defer();
    models.BlockMerchants.create({
        consumer_id: consumer_id,
        merchant_id: coupon_id,
        is_blocked: 1
        
    }).then(function(blocked) {
        deferred.resolve(blocked);
    },function(err){
        deferred.reject(err)
    });
    return deferred.promise;
};




exports.addTokenForNotifications = function(user_id,device_type, token){
    var deferred = Q.defer();
    findToken(user_id, token, device_type).then(function(foundData) {
            if (foundData){
                models.DeviceToken.update({
                    device_type: device_type,
                    token: token
                },{
                    where: {
                        user_id: user_id
                    }
                }).then(function(added) {
                    deferred.resolve(added);
                },function(err){
                    deferred.reject(err)
                });
            } else {
                models.DeviceToken.create({
                   device_type: device_type,
                   token: token,
                   user_id: user_id
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




var findToken = function(user_id, token, device_type){
    var deferred = Q.defer();
    var cond={
                "token": token,
                "device_type": device_type,
                "user_id": user_id
        };
    models.DeviceToken.findOne({
        where: cond
    }).then(function (result) {
            deferred.resolve(result);
        },function (err) {
            deferred.reject(err);
        }
    );
    return deferred.promise;
};