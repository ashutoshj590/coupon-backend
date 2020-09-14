var ini = require('ini');
var Q = require('q');
var fs = require('fs');
var appRoot = process.cwd();
var consts = require('./consts.js');
let httpError = require('../errors/httpError');
let dbError = require('../errors/dbError');
var util = require('../lib/Utils.js');
let httpStatusCodes = require('../constants/httpStatusCodes');
let responseConsts = require('../constants/responseConst');

var sessionTime = 1 * 60 * 60 * 1000;//


var getResponseObject = exports.getResponseObject = function (status, message, success = true) {
    if (status.text == 'error') {
        //logger.log(message);
    }
    return {
        'status': status.text,
        'response_code': status.code,
        'response_message': status.text === 'success' ? "" : message,
        'success': status.success
    }
};

/*
 *Config file will have all the db credentials and environment specific settings.
 *Do not
 */
var config = exports.parsedConfig = (function () {
    return consts.parsedConfig;
})();

var validField = exports.validField = function (fieldVal) {
    if (!fieldVal || fieldVal == null || fieldVal == undefined) {
        return false;
    } else {
        return true;
    }
};



let refreshSession = module.exports.refreshSession = (session, user, sessionTime) => {
    session.user_id = user.id;
    session.name = user.name != undefined ? user.name : "user";
    if (validField(user.is_master_admin) && user.is_master_admin === true) {
        session.is_master_admin = true;
    }
    session.age = user.age;
    session.name = user.name;
    session.phone = user.phone;
    session.email = user.email;
    session.type = user.type;
    session.device_id = user.device_id;
    // session.cookie.expires = new Date(Date.now() + sessionTime);
    return session;
}

exports.checkSession = function (req) {
    if (!validField(req.session)) {
        return false;
    }
    var currentUser = req.session.user_id;
    var device_id = req.session.device_id;
    if (!validField(currentUser) || !validField(device_id)) {
        return false;
    } else {
        return currentUser;
    }
};

/*
 *  Middleware to check if all required params are present
 *  referred from https://stackoverflow.com/questions/12737148/creating-a-expressjs-middleware-that-accepts-parameters
 */
var hasJsonParam = exports.hasJsonParam = function (paramArray) {
    return hasJsonParam[paramArray] || (hasJsonParam[paramArray] = function (req, res, next) {
        var jsonBody = req.body;
        try {
            var counter = paramArray.length;
            let responseArray = [];
            for (var i = 0; i < paramArray.length; i++) {
                if (!jsonBody.hasOwnProperty(paramArray[i])) {
                    responseArray.push(responseConsts.MISSING_PARAM(paramArray[i]));
                }
                counter--;
                if (counter == 0 && responseArray.length > 0) {
                    sendError(new httpError(httpStatusCodes.BAD_REQUEST, { response: responseArray }), req, res);
                } else if (counter == 0) {
                    next();
                }
            }
        } catch (e) {
            sendError(new httpError(httpStatusCodes.BAD_REQUEST, { response: responseConsts.INVALID_JSON }), req, res);
        }
    })
};

/*
 *  Middleware to check if API is accessible to user with particular type
 */
var allowedUser = exports.allowedUser = function (paramArray) {
    return allowedUser[paramArray] || (allowedUser[paramArray] = function (req, res, next) {
        var userType = req.session.type;
        if (paramArray.indexOf(userType) == -1) {
            res.send(getResponseObject(consts.RESPONSE_UNAUTHORIZED, userType + " is not allowed to access this" +
                " API"));
        } else {
            next();
        }
    })
};

exports.getPageLayoutData = function (req, header, desc, title) {

    var page_data = {
        page_header: header,
        page_desc: desc,
        page_title: title
        //     first_name: req.session.first_name,
        //     user_image: req.session.user_image
    };
    return page_data;
};


let sendResponse = (data, req, res) => {
    res.status(200).json(data);
};

module.exports.sendResponse = sendResponse;

let sendError = (err, req, res) => {
    console.log('Error is', err);
    if (err instanceof httpError) {
        let { response: err_string } = err.response;
        if (err_string == '') {
            err_string = 'Some unknown error occured';
        }
        res.status(err.httpCode).json(getResponseObject({ text: err_string, code: err.httpCode}) || {}); //, success: false 
        //res.status(err.httpCode).json(err.response || {});
        return;
    }
    if (err instanceof dbError) {
        //Log it somewhere and send something bad happened error
        res.status(500).json({ response: 'Something really bad happened' });
        return;
    }
    //Dont throw it for now
    //throw err;
    res.statusMessage = err;
    res.status(500).end();
};





module.exports.sendError = sendError;