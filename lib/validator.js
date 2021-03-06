'use strict';

/**
 * This validator is responsible for
 * validating and tacking JWT usage
 *
 * @return {Object} validator functions
 */
module.exports = function(){
  var waterlock = this;

  return {

    /**
     * Validates a token
     *
     * @param  {String}   token the token to be validated
     * @param  {Function} cb    called when error has occured or token is validated
     */
    validateToken: function(token, cb){
      try{
        // decode the token
        var _token = waterlock.jwt.decode(token, waterlock.config.jsonWebTokens.secret);

        // set the time of the request
        var _reqTime = Date.now();

        // If token is expired
        if(_token.exp <= _reqTime){
          waterlock.logger.debug('access token rejected, reason: EXPIRED');
          return cb('Your token is expired.');
        }

        // If token is early
        if(_reqTime <= _token.nbf){
          waterlock.logger.debug('access token rejected, reason: TOKEN EARLY');
          return cb('This token is early.');
        }

        // If audience doesn't match
        if(waterlock.config.jsonWebTokens.audience !== _token.aud){
          waterlock.logger.debug('access token rejected, reason: AUDIENCE');
          return cb('This token cannot be accepted for this domain.');
        }

        this.findUserFromToken(_token, cb);

      } catch(err){
        cb(err);
      }
    },

    /**
     * Find the user the give token is issued to
     *
     * @param  {Object}   token The parsed token
     * @param  {Function} cb    Callback to be called when a user is
     *                          found or an error has occured
     */
    findUserFromToken: function(token, cb){
      // deserialize the token iss
      var _iss = token.iss.split('|');

      waterlock.User.findById(_iss[0]).then(function(user){
         return cb(null, user);
      }).catch(function (err) {
        if(err){
          waterlock.logger.debug(err);
        }
        return cb(err,null);
      });
    },

    /**
     * Validates a token from an Express request object
     *
     * @param  {Express request}   req the Express request object
     * @param  {Function} cb  Callback when to be called when token
     *                        has been validated or an error has occured
     */
    validateTokenRequest: function(req, cb){
      var self = this;

      var token = waterlock._utils.getAccessToken(req);

      if(token){

        // validate the token
        this.validateToken(token, function(err, user){
          if(err){
            waterlock.logger.debug(err);
            return cb(err);
          }

          // check if we're running in stateless
          if(!waterlock.config.jsonWebTokens.stateless){
            self.bindToSession(req, user);
          }

          // check if we're tracking usage
          if(waterlock.config.jsonWebTokens.trackUsage){
            var address = waterlock.cycle._addressFromRequest(req);
            return self.trackTokenUsage(address, token, user, cb);
          }

          waterlock.logger.debug('access token accepted');
          cb(null, user);
        });
      }else{
        waterlock.logger.debug('no access token present');
        cb('Access token not present.');
      }
    },

    /**
     * Attaches a user object to the Express req session
     *
     * @param  {Express request} req  the Express request object
     * @param  {Waterline DAO} user the waterline user object
     */
    bindToSession: function(req, user){
      req.session.authenticated = true;
      req.session.user = user;
    },

    /**
     * Finds the DAO instance of the give token and tracks the usage
     *
     * @param  {String}   token   the raw token
     * @param  {Object}   address the transport address
     * @param  {Function} cb      Callback to be invoked when an error has
     *                            occured or the token was tracked successfully
     */
    findAndTrackJWT: function(token, address, cb){
      waterlock.Jwt.findOne({where:{token: token}}).then(function (j) {
        
        if(!j){
          waterlock.logger.debug('access token not found');
          return cb('Token not found');
        }

        if(j.revoked){
          waterlock.logger.debug('access token rejected, reason: REVOKED');
          return cb('This token has been revoked');
        }

        var use = {uses_id: j.id, remoteAddress: address.ip};
        waterlock.Use.create(use).then(function(){});

        cb(null);
      }).catch( function(err){
        return cb(err);
      });
    },

    /**
     * Tracks the tokens usage and invokes the user defined callback
     *
     * @param  {Object}   address the transport address
     * @param  {String}   token   the raw token
     * @param  {Waterline DAO}   user    the waterline user object
     * @param  {Function} cb      Callback to be invoked when an error has occured
     *                            or the token has been tracked successfully
     */
    trackTokenUsage: function(address, token, user, cb){
      this.findAndTrackJWT(token, address, function(err){
        if(err){
          waterlock.logger.debug(err);
          return cb(err);
        }
        cb(null, user);
      });
    }
  };
};
