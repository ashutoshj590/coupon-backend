'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  };
  User.init({
    email: DataTypes.STRING,
    password: DataTypes.STRING,
    type: {
      type :DataTypes.ENUM,
      values: ['admin','merchant','consumer']
      },
      device_type: {
        type :DataTypes.ENUM,
        values: ['android','apple']
        },
    is_registered: DataTypes.BOOLEAN,
    login_type: {
      type :DataTypes.ENUM,
      values: ['g','f']
      },
      fb_id: DataTypes.STRING,
      google_id: DataTypes.STRING,
      status: DataTypes.STRING,
      lat: DataTypes.INTEGER,
      lang: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'User',
  });
  return User;
};