'use strict';

/**
 * Returns an object attributes for the KeyStat model
 * @param  {Object} attributes user defined attributes for the ApiKey model
 * @return {Object} the user defined attributes combined with the template
 */
exports.attributes = function(attributes){
  var _ = require('lodash');

  var template = {
    remoteAddress: {
      type: Sequelize.STRING
    },
    // jsonWebToken: {
    //   model: 'jwt'
    // },
  };

  return _.merge(template, attributes);
};

/**
 * model associations
 */
exports.associations = function () {
  var _ = require('lodash');
  //waterlock.Use.belongsTo(waterlock.Jwt, {as: 'jsonWebToken'});
};

/**
 *  model options
 * @param  {obejct} options user defined options
 * @return {object} options merged with template and method model object
 */
exports.options = function (options) {
  var _ = require('lodash');
  var template = {
    tableName: 'auth_use',
  };

  return _.merge(template, options);

};