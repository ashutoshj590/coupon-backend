var bcrypt = require('bcryptjs');

module.exports.encrypt = function (password) {
    return new Promise((resolve, reject) => {
        bcrypt.genSalt(10, function(err, salt) {
            bcrypt.hash(password, salt, function(err, hash) {
                resolve(hash);
            });
        });
    });
};



module.exports.compare = function (str, compareStr) {
    return new Promise((resolve, reject) => {
        bcrypt.compare(str, compareStr, (err, same) => {
            if (err) {
                return reject(new Error('Failed'));
            }
            if (!same) {
                return reject();
            }
            resolve();
        });
    })

} 