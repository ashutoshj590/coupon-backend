'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('UsedCoupons', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      consumer_id: {
        type: Sequelize.INTEGER
      },
      merchant_id: {
        type: Sequelize.INTEGER
      },
      coupon_id: {
        type: Sequelize.INTEGER
      },
      coupon_type: {
        type: Sequelize.ENUM('flash','community','custom')
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('UsedCoupons');
  }
};