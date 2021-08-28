'use strict';
module.exports = {
  up: function(queryInterface, Sequelize) {
    return queryInterface.addColumn('DeviceTokens', 'user_id',{
        type: Sequelize.INTEGER
    });
  },
  down: function(queryInterface, Sequelize) {
    return queryInterface.removeColumn('DeviceTokens', 'user_id');
  }
};
