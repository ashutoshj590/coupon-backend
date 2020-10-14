'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class FavCoupons extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  };
  FavCoupons.init({
    consumer_id: DataTypes.INTEGER,
    merchant_id: DataTypes.INTEGER,
    coupon_id: DataTypes.INTEGER,
    is_fav: DataTypes.BOOLEAN
  }, {
    sequelize,
    modelName: 'FavCoupons',
  });
  return FavCoupons;
};