'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Registration extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  };
  Registration.init({
    user_id: DataTypes.INTEGER,
    address: DataTypes.STRING,
    city: DataTypes.STRING,
    state: DataTypes.STRING,
    zipcode: DataTypes.STRING,
    business_name: DataTypes.STRING,
    tagline: DataTypes.STRING,
    website: DataTypes.STRING,
    phone_no: DataTypes.STRING,
    business_license_no: DataTypes.STRING,
    description: DataTypes.STRING,
    opening_time: {
      type: DataTypes.STRING
    },
    closing_time: {
      type: DataTypes.STRING
    }  
  }, {
    sequelize,
    modelName: 'Registration',
  });
  return Registration;
};