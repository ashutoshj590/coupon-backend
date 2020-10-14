let models = require('../models');
let { User } = models;
let getUserByWhere = (where) => {
    return User.find({ where });
}
module.exports.findUserByEmailAndType = (email, type) => {
    return getUserByWhere({
        email: email,
        type: type
    });
};

module.exports.findUserByEmail = (email) => {
    return getUserByWhere({
        email: email
       // type: type
    });
};

module.exports.findUserByUserId = (userId) => {
    return getUserByWhere({
        id: userId
    });
};

module.exports.createUser = (user) => {
    return User.create(user);
}

module.exports.getUserFromFBProfileId = (profileId) => {
    return getUserByWhere({
        fid: profileId
    });
}

module.exports.getUserFromEmail = (email) => {
    return getUserByWhere({
        email
    });
}

module.exports.updateFidInUser = (userFb, id) => {
    userFb.fid = id;
    return userFb.save();
}

module.exports.markOTPVerified = (user) => {
    user.emailVerified = 1;
    return user.save();
}

module.exports.updateUserAsType = (email, type) => {
    return User.update({
        type: type
    },  {
        where:{
            email: email
        }
     });
}
