'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class UsedCoupons extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  };
  UsedCoupons.init({
    consumer_id: DataTypes.INTEGER,
    merchant_id: DataTypes.INTEGER,
    coupon_id: DataTypes.INTEGER,
    coupon_type: {
      type :DataTypes.ENUM,
      values: ['flash','community','custom']
      },
      coupon_code: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'UsedCoupons',
  });
  return UsedCoupons;
};