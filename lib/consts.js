/**
 * Created by tarun on 27/06/17.
 */
var ini = require('ini');
var fs = require('fs');
var appRoot = process.cwd();



/**
 * @apiDefine SuccessResponse
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *          "status": "success"
 *          "response_code": 200
 *          "response_message": ""
 *     }
 *
 */

/**
 * @apiDefine EntityNotFound
 *
 * @apiErrorExample Error-Response:
 *     HTTP/1.1 404 Not Found
 *     {
 *       "status": "no_result_found"
 *       "response_code": 404
 *       "response_message": "No result obtained from DB for given entity, based on provided filters."
 *     }
 */

/**
 * @apiDefine MissingReqParam
 *
 * @apiErrorExample Error-Response:
 *     HTTP/1.1 407 Missing Param
 *     {
 *       "status": "missing_param"
 *       "response_code": 407
 *       "response_message": "One or more request parameters missing"
 *     }
 */

/**
 * @apiDefine UnauthorizedAction
 *
 * @apiErrorExample Error-Response:
 *     HTTP/1.1 406 Unauthorized
 *     {
 *       "status": "unauthorized"
 *       "response_code": 406
 *       "response_message": "User not allowed."
 *     }
 */

/**
 * @apiDefine Error
 *
 * @apiErrorExample Error-Response:
 *     HTTP/1.1 403 Error
 *     {
 *       "status": "error"
 *       "response_code": 403
 *       "response_message": "There was an error performing the action. Please try again"
 *     }
 */

exports.RESPONSE_SUCCESS = {code: 200 };
exports.RESPONSE_SESSION_EXPIRED = { code: 405 };
exports.RESPONSE_ERROR = { code: 403 };
exports.RESPONSE_UNAUTHORIZED = { code: 406 };
exports.RESPONSE_MISSING_PARAM = {  code: 407 };
exports.RESPONSE_DATA_NOT_FOUND = { code: 404 };


exports.OTP_TYPE = {
    'verify_email': { 'key_name': 'VERIFY_EMAIL', 'ttl': 360000 },
    'forgot_password': { 'key_name': 'FORGOT_PASSWORD', 'ttl': 3600 }
};

exports.GRAPH_PREFIX = {
    USER: "user_"
}

exports.GRAPH_RELATIONSHIPS = {
    FRIEND_REQUESTED: "F_R",
    FRIEND_ACCEPTED: "F_A",
    FRIEND_WITH: "F_W"
}

exports.EXEMPTED_ROUTES = [
    '/admin/authenticate',
    '/auth/login',
    '/auth/sign-up',
    '/auth/fbLogin',
    '/auth/verifyOtp',
    '\/admin\/',
    '\/admin',
    '/user/init-session'
];

/*
 *Config file will have all the db credentials and environment specific settings.
 *Do not
 */
var config = exports.parsedConfig = (function () {
    return ini.parse(fs.readFileSync(appRoot + '/config' + '/config.ini', 'utf-8'));
})();

exports.VERIFY_EMAIL_TEXT = "Your OTP to verify you JoyScor account is: <strong>VAR_OTP</strong> <br \>This OTP is valid for 60 minutes only";