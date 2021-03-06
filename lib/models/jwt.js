'use strict';

/**
 * Returns an object attributes for the ApiKey model
 * @param  {Object} attributes user defined attributes for the ApiKey model
 * @return {Object} the user defined attributes combined with the template
 */
exports.attributes = function(attributes){
  var _ = require('lodash');

  var template = {
    token: {
      type: Sequelize.STRING(512),
      validate: {
        max: 512
      }
    },
    // uses: {
    //   collection: 'use',
    //   via: 'jsonWebToken'
    // },
    // owner: {
    //   model: 'user'
    // },
    revoked: {
      type: Sequelize.BOOLEAN,
      allowNull: false, 
      //defaultValue: false
    }
  };

  return _.merge(template, attributes);
};

/**
 * model associations
 */
exports.associations = function () {
  var _ = require('lodash');
  waterlock.Jwt.hasMany(waterlock.Use, {as: 'Uses',foreignKey: 'uses_id', onDelete:'CASCADE'});
  waterlock.Jwt.belongsTo(waterlock.User, {as: 'owner',foreignKey: 'jwt_uid'})
};

/**
 *  model options
 * @param  {obejct} options user defined options
 * @return {object} options merged with template and method model object
 */
exports.options = function (options) {
  var _ = require('lodash');
  var template = {
    tableName: 'auth_jwt',
  };

  return _.merge(template, options);

};
