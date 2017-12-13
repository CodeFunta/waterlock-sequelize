'use strict';

/**
 * Attempts describes an user's login, if it was successful, what ip it came from etc.
 * @param  {object} attributes any attributes to append to the attempt model
 * @return {object} the template merged with the user defined attributes
 */
exports.attributes = function(attributes){
  var _ = require('lodash');
  
  var template = {
    // user:{
    //   model: 'user'
    // },
    successful:{
      type: Sequelize.BOOLEAN,
      allowNull: false, 
      defaultValue: false
    },
    ip:{
      type: Sequelize.STRING,
    },
    port:{
      type: Sequelize.STRING
    }
  };

  return _.merge(template, attributes);
};

/**
 * model associations
 */
exports.associations = function () {
  var _ = require('lodash');
  waterlock.attempt.belongsTo(waterlock.user, {as: 'user'});
};

/**
 *  model options
 * @param  {obejct} options user defined options
 * @return {object} options merged with template and method model object
 */
exports.options = function (options) {
  var _ = require('lodash');
  var template = {
    tableName: 'auth_attempt',
  };

  return _.merge(template, options);

};