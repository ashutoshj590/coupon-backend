'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Requests extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  };
  Requests.init({
    consumer_id: DataTypes.INTEGER,
    merchant_id: DataTypes.INTEGER,
    sub_category_id: DataTypes.INTEGER,
    detail: DataTypes.STRING,
    date: DataTypes.STRING,
    time: {
      type :DataTypes.ENUM,
      values: ['morning','afternoon','evening']
      },
    is_deleted: DataTypes.BOOLEAN
  }, {
    sequelize,
    modelName: 'Requests',
  });
  return Requests;
};