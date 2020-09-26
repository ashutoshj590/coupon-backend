'use strict';
module.exports = {
  up: function(queryInterface, Sequelize) {
    return queryInterface.addColumn('Coupons', 'is_fav',{
        type: Sequelize.BOOLEAN
    });
  },
  down: function(queryInterface, Sequelize) {
    return queryInterface.removeColumn('Coupons', 'is_fav');
  }
};
