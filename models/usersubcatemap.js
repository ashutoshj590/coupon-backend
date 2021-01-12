'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class UserSubCateMap extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  };
  UserSubCateMap.init({
    user_id: DataTypes.INTEGER,
    sub_category_id: DataTypes.INTEGER,
    lat: DataTypes.INTEGER,
      lang: DataTypes.INTEGER,
  }, {
    sequelize,
    modelName: 'UserSubCateMap',
  });
  return UserSubCateMap;
};