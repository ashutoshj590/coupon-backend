let bcrypt = require('bcrypt');
module.exports.encrypt = function (password) {
    return new Promise((resolve, reject) => {
      //  bcrypt.hash(password, 10).then(function (hash) {
        bcrypt.hash(password, salt , (err, hash) => {
            resolve(hash);
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