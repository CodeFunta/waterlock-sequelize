'use strict';

var _ = require('lodash');
var uuid = require('uuid');
/**
 * This engine is responsible for
 * finding, creating and updating auth objects
 *
 * @return {Object} engine functions
 */
module.exports = function () {
	var waterlock = this;

	return {

		/**
		 * Simple wrapper for Auth find/populate method
		 *
		 * @param  {Object}   criteria should be id to find the auth by
		 * @param  {Function} cb         function to be called when the auth has been
		 *                               found or an error has occurred
		 * @api public
		 */
		findAuth: function (criteria, cb) {
			var self = this;
			waterlock.Auth.findOne({ where: criteria, include: [{ model: waterlock.User, as: 'user' }] })
				.then(function (auth) {
					cb(null, self._invertAuth(auth));
				}).catch(function (err) {
					cb(err);
				});
		},

		/**
		 * This will create a user and auth object if one is not found
		 *
		 * @param  {Object}   auth auth object
		 * @param  {Function} cb         function to be called when the auth has been
		 *                               found or an error has occurred
		 * @api private
		 */
		_attachAuthToUser: function (auth, cb) {
			var self = this;

			// create the user
			if (!auth.auth_uid) {
				// this is where we want to figure out if the auth we have here can be attached to an existing user
				// scenario 1:

				// - user has authenticated local auth with 1@1.com and uname:
				// - the user now has:
				// - - 1 auth object with 1@1.com and uname
				// - - 1 user object with uname
				// - user authenticates with 1@1.com using facebook
				// - we need to create the auth object with facebook provider and attach them to the existing user associated with the other auth object of the same email address


				// scenario 2:
				// - user has authenticated local auth with 1@1.com and uname:
				// - the user now has:
				// - - 1 auth object with 1@1.com and uname
				// - - 1 user object with uname
				// - user authenticates with 1@1.com using spotify but with a completely different email address but they are logged in
				//   we can assume they are linking the auths


				// check to see if there is another auth we can merge with:

				waterlock.Auth.findOne({
					where: { email: auth.email },
					include: [{ model: waterlock.User, include: [ waterlock.Auth ] }]
				})
					.then(function (found) {


						if (found && found.id !== auth.id) {

							auth.update(
								{auth_uid: (found.user.ID || found.user.id)}
							)
							.then(function () {
								found.user.auths.push(auth.shift());
								return cb(null, found.user);
							}).catch(function (err) {
								waterlock.logger.debug(err);
								return cb(err);
							});

						} else {
							waterlock.User.create({
								uid: uuid.v4(),
								auths: [auth.id]
							},{include: [ waterlock.Auth ]})
								.then(function (user) {
									// update the auth object
									auth.update({
										auth_uid: (user.ID || user.id)
									})
										.then(function () {
											if (!user.auths) {
												user.auths = [];
											}
											user.auths.push(auth);
											return cb(err, user);
										});
								}).catch(function (err) {
									waterlock.logger.debug(err);
									return cb(err);
								});
						}
					}).catch(function (err) {
						waterlock.logger.debug(err);
						return cb(err);
					});

			} else {
				// just fire off update to user object so we can get the
				// backwards association going.

				waterlock.User.findById((auth.user.ID || auth.user.id),{include: [ {model:waterlock.Auth} ] })
					.then(function (user) {
						
						if (!_.some(auth.user.auths, {
							provider: auth.provider
						})) {

							var existingAuths = user.auths;
							existingAuths.push({
								auths: [{
									id: auth.id
								}]
							});
							return user.setauth(existingAuths).then(()=>{
								cb(null, self._invertAuth(auth));
							});
							// return waterlock.User.update({auth_uid:auth.id},{ where: {ID:(auth.user.ID || auth.user.id)}}).then(()=>{
							// 	cb(null, self._invertAuth(auth));
							// });
							
						}
						return cb(null, self._invertAuth(auth));
					});
			}
		},

		/**
		 * Find or create the auth then pass the results to _attachAuthToUser
		 *
		 * @param  {Object}   criteria   should be id to find the auth by
		 * @param  {Object}   attributes auth attributes
		 * @param  {Function} cb         function to be called when the auth has been
		 *                               found or an error has occurred
		 *
		 * @api public
		 */
		findOrCreateAuth: function (criteria, attributes, cb) {
			var self = this;
			waterlock.Auth.findCreateFind({ where: { criteria }, defaults: attributes ,include: {model:waterlock.User}})
				.then(function (newAuth,created) {
					self._attachAuthToUser(newAuth, cb);
				}).catch(function (err) {
					waterlock.logger.debug(err);
					return cb(err);
				});
		},

		/**
		 * Attach given auth attributes to user
		 *
		 * @param  {Object}   attributes auth attributes
		 * @param  {Object}   user       user instance
		 * @param  {Function} cb         function to be called when the auth has been
		 *                               attached or an error has occurred
		 * @api public
		 */
		attachAuthToUser: function (attributes, user, cb) {
			var self = this;
			attributes.user = (user.ID || user.id);

			waterlock.User.findOne({where:{id:(user.ID || user.id)}, include:[{model: waterlock.Auth}]})
				.then(function (user) {

					var foundAuth = _.find(user.auths, function (o) {
						return o.provider === attributes.provider;
					});

					if (foundAuth) {

						delete (attributes.auth);
						//update existing auth
						waterlock.Auth.findOne({where:{id:foundAuth.id}})
							.then(function (auth) {
								
								// Check if any attribtues have changed if so update them
								if (self._updateAuth(auth, attributes)) {
									
									auth.save()
										.then(function (auth_upd) {
											
											user.auths.push(auth_upd);
											cb(null, user);
										}).catch(function (err) {
											if (err) {
												waterlock.logger.debug(err);
												return cb(err);
											}
										});
								} else {
									user.auths.push(auth);
									return cb(null, user);
								}

							}).catch(function (err) {
								if (err) {
									waterlock.logger.debug(err);
									return cb(err);
								}
							});
					} else {
						// force create by pass of user id
						//self.findOrCreateAuth(user.id, attributes, cb);
						self.findOrCreateAuth({
							user: (user.ID || user.id),
							provider: attributes['provider']
						}, attributes, cb);
					}
				}).catch(function (err) {
					waterlock.logger.debug(err);
					return cb(err);
				});
		},

		/**
		 * Inverts the auth object so we don't need to run another query
		 *
		 * @param  {Object} auth Auth object
		 * @return {Object}      User object
		 * @api private
		 */
		_invertAuth: function (auth) {
			// nothing to invert
			if (!auth || !auth.user) {
				return auth;
			}

			var u = auth.user;
			delete (auth.user);
			u.auths = [auth];
			return u;
		},

		/**
		 * Decorates the auth object with values of the attributes object
		 * where the attributes differ from the auth
		 *
		 * @param  {Object} auth       waterline Auth instance
		 * @param  {Object} attributes used to update auth with
		 * @return {Boolean}           true if any values were updated
		 */
		_updateAuth: function (auth, attributes) {
			if (!_.isEqual(auth, attributes)) {
				_.merge(auth, attributes);
				return true;
			}
			return false;
		}
	};
};
