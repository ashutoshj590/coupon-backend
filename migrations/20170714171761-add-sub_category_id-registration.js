'use strict';
module.exports = {
  up: function(queryInterface, Sequelize) {
    return queryInterface.addColumn('Registrations', 'sub_category_id',{
      type: Sequelize.INTEGER
    });
  },
  down: function(queryInterface, Sequelize) {
    return queryInterface.removeColumn('Registrations', 'sub_category_id');
  }
};
