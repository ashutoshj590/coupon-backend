'use strict';

var fs        = require('fs');
var path      = require('path');
var Sequelize = require('sequelize');
var basename  = path.basename(module.filename);
var env       = 'read';
var config    = require(__dirname + '/../config/config.json')[env];
var db        = {};

var sequelize = new Sequelize(config.database, config.username, config.password, config, {
  host: config.database.hostname,
  dialect: 'mysql',

  pool: {
    max: 30,
    min: 0,
    idle: 10000
  }

});

sequelize
    .authenticate()
    .then(function(err) {
      console.log('Connection has been established successfully to reporting database.')
    })
    .catch(function (err) {
      console.log('Unable to connect to the reporting database.');
      console.log(err);
    }
);

fs
  .readdirSync(__dirname)
  .filter(function(file) {
    return (file.indexOf('.') !== 0) && (file.indexOf('index') == -1) && (file !== basename) && (file.slice(-3) === '.js');
  })
  .forEach(function(file) {
    //var model = sequelize['import'](path.join(__dirname, file));
    var model = require(path.join(__dirname, file))(sequelize, Sequelize.DataTypes);
    db[model.name] = model;
  });

Object.keys(db).forEach(function(modelName) {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;

