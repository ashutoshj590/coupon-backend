'use strict';
module.exports = {
  up: function(queryInterface, Sequelize) {
    return queryInterface.addColumn('Registrations', 'opening_time',{
      type: Sequelize.STRING
    });
  },
  down: function(queryInterface, Sequelize) {
    return queryInterface.removeColumn('Registrations', 'opening_time');
  }
};
