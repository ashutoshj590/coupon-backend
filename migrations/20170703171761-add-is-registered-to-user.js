'use strict';
module.exports = {
  up: function(queryInterface, Sequelize) {
    return queryInterface.addColumn('Users', 'is_registered',{
        type: Sequelize.BOOLEAN
    });
  },
  down: function(queryInterface, Sequelize) {
    return queryInterface.removeColumn('Users', 'is_registered');
  }
};
