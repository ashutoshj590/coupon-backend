'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class UploadImgs extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  };
  UploadImgs.init({
    user_id: DataTypes.INTEGER,
    image: DataTypes.STRING,
    is_deleted: DataTypes.BOOLEAN,
    is_flash_deal: DataTypes.BOOLEAN,
    coupon_id: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'UploadImgs',
  });
  return UploadImgs;
};