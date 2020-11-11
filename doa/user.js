let models = require('../models');
let { User } = models;
let getUserByWhere = (where) => {
    return User.findOne({ where });
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

module.exports.findUserByFbId = (fb_id) => {
    return getUserByWhere({
        fb_id: fb_id
       // type: type
    });
};


module.exports.findUserByGoogleId = (google_id) => {
    return getUserByWhere({
        google_id: google_id
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

