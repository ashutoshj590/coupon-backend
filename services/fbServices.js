var FB = require('fb');
class FBUtils {
    constructor(accessToken) {
        this.token = accessToken;
    }

    getUserBasics() {
        return new Promise((resolve, reject) => {
            FB.api('me', { fields: ['id', 'name', 'email', 'gender', 'picture.type(large)'], access_token: this.token }, (res) => {
                resolve(res);
            });
        });
    }

    parsePhotoUrlFromFbResponse(fbUserObj) {
        let { picture } = fbUserObj;
        if (picture.data != null) {
            let { url } = picture.data;
            return url;
        } else {
            throw new Error('Cannot be parsed');
        }
    }
}
module.exports = FBUtils;