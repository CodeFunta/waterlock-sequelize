'use strict';

var _ = require('lodash');
var uuid = require('uuid');




/**
 * This will create a user and auth object if one is not found
 *
 * @param  {Object}   auth auth object
 * @param  {Function} cb         function to be called when the auth has been
 *                               found or an error has occurred
 * @api private
 */
async function _attachAuthToUser(auth, mapUserCriteria, userdefaults) {
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

		let found = await waterlock.Auth.findOne({
			where: { email: auth.email },
			include: [{ association: "user", include: [ {association: "auths"} ] }],
			//transaction:t
		});
		if (found && found.id !== auth.id) {

			await auth.update({auth_uid: (found.user.ID || found.user.id)});
			found.user.auths.push(auth.shift());
			return found.user;
		} else {
			let [user,created] = await waterlock.User.findOrCreate({
				where: mapUserCriteria, 
				defaults: userdefaults,
				include: [ {association: "auths"} ],
				//transaction:t
			});
			user.$$created = created;
			await auth.update({auth_uid: (user.ID || user.id)});
			if (!user.auths) {
				user.auths = [];
			}
			user.auths.push(auth);
			return user;
		}

	} else {
		// just fire off update to user object so we can get the
		// backwards association going.

		let user = await waterlock.User.findById(auth.auth_uid,{include: [ {association: "auths"}] });
		if (!_.some(auth.user.auths, {
			provider: auth.provider
		})) {

			var existingAuths = user.auths;
			existingAuths.push({
				auths: [{
					id: auth.id
				}]
			});

			await user.setAuths(existingAuths);
		}
		//return _invertAuth(auth);
		return user;
	}
}

/**
 * Inverts the auth object so we don't need to run another query
 *
 * @param  {Object} auth Auth object
 * @return {Object}      User object
 * @api private
 */
function _invertAuth(auth) {
	// nothing to invert
	if (!auth || !auth.user) {
		return auth;
	}

	var u = auth.user;
	delete (auth.user);
	u.auths = [auth];
	return u;
}

/**
 * Decorates the auth object with values of the attributes object
 * where the attributes differ from the auth
 *
 * @param  {Object} auth       waterline Auth instance
 * @param  {Object} attributes used to update auth with
 * @return {Boolean}           true if any values were updated
 */
function _updateAuth(auth, attributes) {
	if (!_.isEqual(auth, attributes)) {
		_.merge(auth, attributes);
		return true;
	}
	return false;
}


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
		findAuth: async (criteria) => {
			let auth = await waterlock.Auth.findOne({ where: criteria, include: [{ model: waterlock.User, as: 'user' }] });
			return _invertAuth(auth);
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
		findOrCreateAuth: async (criteria, attributes, mapUserCriteria,userdefaults)  => {
			let [newAuth,created] = await waterlock.Auth.findOrCreate({ where: criteria, defaults: attributes, include: [ {association: "user", include: [{association: "auths"}]}]});
			newAuth.$$created = created;
			return await _attachAuthToUser(newAuth, mapUserCriteria, userdefaults);		
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
		attachAuthToUser: async (attributes, userIn) => {
			attributes.auth_uid = (userIn.ID || userIn.id);

			let user = await waterlock.User.findOne({where:{id:(userIn.ID || userIn.id)}, include:[{association: "auths"}]});

			var foundAuth = _.find(user.auths, function (o) {
				return o.provider === attributes.provider;
			});

			if (foundAuth) {
				delete (attributes.auth);
				//update existing auth
				let auth = await waterlock.Auth.findOne({where:{id:foundAuth.id}});
		
				// Check if any attribtues have changed if so update them
				if (_updateAuth(auth, attributes)) {
					
					let auth_upd = await auth.save();
					user.auths.push(auth_upd);
				} else {
					user.auths.push(auth);
				}
				return user;
			} else {
				// force create by pass of user id
				//self.findOrCreateAuth(user.id, attributes, cb);
				return await self.findOrCreateAuth({
					user: (user.ID || user.id),
					provider: attributes['provider']
				}, attributes);
			}
		},
	};
};
