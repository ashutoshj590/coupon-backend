/*
 Created by Ashutosh joshi
 */

// we're using Redis server for sessions caching
// https://github.com/mranney/node_redis

var redisLib = require("redis");

var util = require("../lib/Utils.js");
var config = util.parsedConfig;

var CUSTOM_PREFIX = "CUSTOM";


// connect to Redis server
function redisConnect() {
    var client = redisLib.createClient(config.redis.port, config.redis.host);
    client.auth(config.redis.auth);
    client.on("error", function (err) {
      //  util.logger("Redis unable to connect",'err');
        //util.logger(err,'err');
    });
    return client;
}

// set global client
var redis = redisConnect();
// get global client

function redisConnection() {
    return redis;
}

// serialize object
function objToStr(obj) {
    try {
        return JSON.stringify(obj);
    } catch(err) {
        return null;
    }
}

// deserialize object
function strToObj(str) {
    try {
        return JSON.parse(str);
    } catch(err) {
        return null;
    }
}

// callback: function (err, object) {}
function hashGetObject(hash, objectKey, callback) {
    var conn = redisConnection();
    conn.HGET(hash, objectKey, function(err, reply) {
        if (err) {
            if (callback) {
                callback(err, null);
            }
            return;
        }
        if (!reply) {
            callback(null, null);
            return;
        }
        if (callback) {
            var obj = strToObj(reply);
            callback(null, obj);
        }
    });
}

// callback: function (err, object) {}
function hashGetAll(hash, callback) {
    var conn = redisConnection();
    conn.HGETALL(hash, function(err, reply) {
        if (err) {
            if (callback) {
                callback(err, null);
            }
            return;
        }
        if (!reply) {
            callback(null, null);
            return;
        }
        if (callback) {
            var obj = strToObj(reply);
            callback(null, reply);
        }
    });
}

// callback: function (err, reply) {}
function hashSetObject(hash, objectKey, obj, callback) {
    var s = objToStr(obj);
    if (!s) {
        callback(new Error('REDIS: Cannot set object to hash. Cannot serialize object!'), null);
        return;
    }
    var conn = redisConnection();
    conn.HSET(hash, objectKey, s, function(err, reply) {
        if (err) {
            if (callback) {
                callback(err, null);
            }
            return;
        }
        if (callback) {
            callback(err, reply);
        }
    });
}

// callback: function (err, reply) {}
function hashDelKey(hash, objectKey, callback) {
    var conn = redisConnection();
    conn.HDEL(hash, objectKey, function(err, reply) {
        if (err) {
            if (callback) {
                callback(err, null);
            }
            return;
        }
        if (callback) {
            callback(err, reply);
        }
    });
}

// set only if hash not exists
// callback: function (err, reply) {}
function hashSetObjectNX(hash, objectKey, obj, callback) {
    var s = objToStr(obj);
    if (!s) {
        callback(new Error('REDIS: Cannot set object to hash. Cannot serialize object!'), null);
        return;
    }
    var conn = redisConnection();
    conn.HSETNX(hash, objectKey, s, function(err, reply) {
        if (err) {
            if (callback) {
                callback(err, null);
            }
            return;
        }
        if (callback) {
            callback(err, reply);
        }
    });
}

// callback: function (err, reply) {}
function setKeyTimeout(key, timeout, callback) {
    var conn = redisConnection();
    conn.EXPIRE(key, timeout, function(err, reply) {
        if (callback) {
            callback(err, reply);
        }
    });
}

function setKeyVal(key, val, ttl, callback){
    var conn = redisConnection();
    conn.set(key, objToStr(val), function(result){
        conn.EXPIRE(key, ttl, function(err, reply) {
            if (callback) {
                callback(err, reply);
            }
        });
    });

}

function getKeyVal(key, callback){
    var conn = redisConnection();
    conn.get(key, function(err, result){
        callback(result, err);
    });

}

function delKey(key){
    var conn = redisConnection();
    conn.del(key, function(err, result){
        //not too important. Async
    });

}

function checkKey(key, callback) {
    var conn = redisConnection();
    conn.EXISTS(key, function(err, reply) {
        if (callback) {
            callback(err, reply);
        }
    });
}

function dataGet(name, key, callback) {
    var hash = CUSTOM_PREFIX + ':' + name;
    hashGetObject(hash, key, function(err, obj) {
        callback(err, obj);
    });
}

function dataGetAll(name, callback) {
    // var hash = "online_users";
    var hash = CUSTOM_PREFIX + ':' + name;
    hashGetAll(hash,  function(err, obj) {
        callback(err, obj);
    });
}

function dataSet(name, key, data, ttl, callback) {
    var hash = CUSTOM_PREFIX + ':' + name;
    var s = objToStr(data);
    if (!s) {
        callback(new Error('REDIS: Cannot set object to hash. Cannot serialize object!'), null);
    } else {
        var conn = redisConnection();
        // atomic update
        var multi = conn.multi();
        multi.HSET(hash, key, s);
        if (ttl)
            multi.EXPIRE(hash, ttl);
        multi.exec(function(err, results) {
            if (callback)
                callback(err, results);
        });
    }
}

function dataDel(name, key, callback){
    var hash = CUSTOM_PREFIX + ':' + name;
    hashDelKey(hash, key, function(err, result){
        if(err != null)
            callback(err, null);
        else
            callback(null, result);
    })
}


exports.dataGet = dataGet;
exports.dataSet = dataSet;
exports.dataGetAll = dataGetAll;
exports.dataDelete = dataDel;
exports.setKeyVal = setKeyVal;
exports.getKeyVal = getKeyVal;
exports.delKey = delKey;

exports.connection = redis;

//========================================================
