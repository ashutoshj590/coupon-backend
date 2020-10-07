'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Coupons extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  };
  Coupons.init({
    user_id: DataTypes.INTEGER,
    coupon_type: {
      type :DataTypes.ENUM,
      values: ['flash','community','custom']
      },
    days: DataTypes.STRING,
    start_time: DataTypes.STRING,
    end_time: DataTypes.STRING,
    expiry_date: DataTypes.STRING,
    flash_deal: DataTypes.BOOLEAN,
    description: DataTypes.TEXT,
    restriction: DataTypes.TEXT,
    is_deleted: DataTypes.BOOLEAN,
    is_fav: DataTypes.BOOLEAN,
    short_name: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'Coupons',
  });
  return Coupons;
};