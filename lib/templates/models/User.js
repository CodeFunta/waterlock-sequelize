'use strict';

/**
 * User
 *
 * @module      :: Model
 * @description :: This is the base user model
 * @docs        :: http://waterlock.ninja/documentation
 */
var _ = require('lodash');

module.exports = {

  attributes: require('waterlock').models.user.attributes({

    /* e.g.
    nickname: 'string'
    */

  }),

  beforeCreate: require('waterlock').models.user.beforeCreate,
  beforeUpdate: require('waterlock').models.user.beforeUpdate,
  associations: require('waterlock').models.user.associations,
  options: require('waterlock').models.user.options,
};
