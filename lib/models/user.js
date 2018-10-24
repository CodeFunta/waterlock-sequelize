'use strict';

/**
 * user model attributes
 * @param  {obejct} attributes user defined attributes
 * @return {object} attributes merged with template and method model object
 */
exports.attributes = function (attributes) {
  var _ = require('lodash');


  var template = {
    uid: {
      type: Sequelize.UUID,
      primaryKey: true,
      allowNull: false,
      validate: {
        isUUID: true
      }
    },
    // attempts: {
    //   collection: 'attempt',
    //   via: 'user'
    // },
    // jsonWebTokens: {
    //   collection: 'jwt',
    //   via: 'owner'
    // },
    // auths: {
    //   collection: 'auth',
    //   via: 'user'
    // }
  };

  return _.merge(template, attributes);
};

/**
 * user model associations
 */
exports.associations = function () {
  var _ = require('lodash');
  waterlock.User.hasMany(waterlock.Attempt, {as: 'attempts',foreignKey: 'attempt_uid'});
  waterlock.User.hasMany(waterlock.Jwt, {as: 'jsonWebTokens',foreignKey: 'jwt_uid'});
  waterlock.User.hasMany(waterlock.Auth, {as: 'auth',foreignKey: 'auth_uid'});
};

/**
 * user model options
 * @param  {obejct} options user defined options
 * @return {object} options merged with template and method model object
 */
exports.options = function (options) {
  var _ = require('lodash');
  var template = {
    tableName: 'auth_user',
  };

  return _.merge(template, options);

};



