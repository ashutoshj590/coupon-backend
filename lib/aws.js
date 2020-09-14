var AWS = require('aws-sdk');
var util = require("./Utils.js");
var config = util.parsedConfig;
var Q = require('q');
var appRoot = process.cwd();
AWS.config.loadFromPath(appRoot+'/config/awsConfig.json');
var fs=require('fs');

var ses = new AWS.SES({apiVersion: '2010-12-01'});
var s3Bucket = new AWS.S3( { params: {Bucket: 'my-joy'} } );

//ses = AWS.createSESClient(config.aws.accessKeyId, config.aws.secretAccessKey);
/*

 ses.call("GetSendQuota", {}, function(err, result) {
 console.log(JSON.stringify(result));
 });

 ses.call("GetSendStatistics", {}, function(err, result) {
 console.log(JSON.stringify(result));
 });

 ses.call("ListVerifiedEmailAddresses", {}, function(err, result) {
 console.log(JSON.stringify(result));
 });

 */

exports.sendEmail = function(to,  subject, template, templateData) {
    var templateBody = fs.readFileSync(appRoot+ '/views/mail_templates/'+template, 'utf-8');
    var deferred = Q.defer();
    var from = "JoyScor Support <joy@ta.run>";
    to = [to];
    getEmailBody(templateBody, templateData, function(emailBody){
        ses.sendEmail({
                Source: from,
                Destination: { ToAddresses: to },
                Message: {
                    Subject:{
                        Data: subject
                    },
                    Body: {
                        Html: {
                            Data: emailBody
                        }
                    }
                }
            },
            function(err, data) {
                if(err) {
                    console.log(err);
                    deferred.reject("Unable to send email");
                }else {
                    deferred.resolve(data);
                }
            }
        );
    });
    return deferred.promise;
};

var getEmailBody = function(emailText, params, callback){
    var i=0;
    Object.keys(params).forEach(function(key) {
        var val = params[key];
        key = "_PARAM_"+key+"_";
        re = new RegExp(key, "g");
        emailText = emailText.replace(re, val);
        i++;
        if(i == Object.keys(params).length){
            callback(emailText);
        }
    });

};

exports.uploadImageToS3 = function(user_id, base64Data){
    var deferred = Q.defer();
    var key = new Date().getTime()+"_"+user_id+"_"+".jpeg";
    var baseUrl = config.aws.s3BuckerUrl;
    var buf = new Buffer(base64Data.replace(/^data:image\/\w+;base64,/, ""),'base64');
   // key = folder+"/"+key;
    var data = {
     //   Key: key,
        Body: buf,
        ContentEncoding: 'base64',
        ContentType: 'image/jpeg',
        ACL:'public-read'
    };
    s3Bucket.putObject(data, function(err, data){
        if (err) {
            deferred.reject(err.errmsg);
            util.logger(err,'err');
        } else {
            deferred.resolve(config.aws.s3BuckerUrl+key);
        }
    });
    return deferred.promise;
};

var notifyAdmin = function(to,  subject, template, templateData){

}
