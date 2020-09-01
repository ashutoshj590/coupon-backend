'use strict';
module.exports = {
  up: function(queryInterface, Sequelize) {
    return queryInterface.addColumn('Categories', 'is_deleted',{
      type: Sequelize.INTEGER
    });
  },
  down: function(queryInterface, Sequelize) {
    return queryInterface.removeColumn('Categories', 'is_deleted');
  }
};
