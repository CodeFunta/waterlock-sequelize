'use strict';

var _ = require('lodash');

/**
 * Attempts describes an user's login, if it was successful, what ip it came from etc.
 * @param  {object} attributes any attributes to append to the attempt model
 * @return {object} the template merged with the user defined attributes
 */
exports.attributes = function(attributes) {

	var methods = waterlock.methods;

	_.each(methods, function(method) {
		if (_.has(method, 'model')) {
			// call the decorator of each auth method
			method.model.auth.attributes(attributes);
		}
	});

	var template = {
		// user: {
		// 	model: 'user'
		// },
		provider: {
			type: Sequelize.STRING
		},
		thirdPartyId: {
			type: Sequelize.STRING
		},
		email: {
			type: Sequelize.STRING,
			// validate: {
			// 	isEmail: true
			// }
		},
		name: {
      		type: Sequelize.STRING
		},
		username: {
		type: Sequelize.STRING,
		validate: {
			min: 4
		}
		}
	};

	return _.merge(template, attributes);
};

/**
 * model associations
 */
exports.associations = function () {
	var _ = require('lodash');
	waterlock.Auth.belongsTo(waterlock.User, {as: 'user',foreignKey: 'auth_uid',onDelete:'CASCADE'});
  };
  
  /**
   *  model options
   * @param  {obejct} options user defined options
   * @return {object} options merged with template and method model object
   */
  exports.options = function (options) {
	var _ = require('lodash');
	var template = {
	  tableName: 'auth',
	  indexes: [
		  {
			unique:true,
		  	fields:['username']
		  }
	  ]
	};
  
	return _.merge(template, options);
  
  };

/**
 * used to hash the password
 * @param  {object}   values
 * @param  {Function} cb
 */
exports.beforeCreate = function(values) {
	var methods = waterlock.methods;
	_.each(methods, function(method) {
		var model = method.model.auth;
		if (_.has(model, 'beforeCreate')) {
			model.beforeCreate(values);
		}
	});
};

/**
 * used to update the password hash if user is trying to update password
 * @param  {object}   values
 * @param  {Function} cb
 */
exports.beforeUpdate = function(values) {
	var methods = waterlock.methods;
	_.each(methods, function(method) {
		var model = method.model.auth;
		if (_.has(model, 'beforeUpdate')) {
			model.beforeUpdate(values);
		}
	});
};
