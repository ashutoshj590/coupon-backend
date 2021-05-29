'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class BlockMerchants extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  };
  BlockMerchants.init({
    consumer_id: DataTypes.INTEGER,
    merchant_id: DataTypes.INTEGER,
    is_blocked: DataTypes.BOOLEAN
  }, {
    sequelize,
    modelName: 'BlockMerchants',
  });
  return BlockMerchants;
};