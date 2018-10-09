'use strict';

/* global waterlock */

/**
 * jwt action
 *
 * creates a new token if a session is authenticated
 *
 * GET /user/jwt
 */
module.exports = function (req, res) {
    if (!req.session.authenticated) {
        return res.forbidden('You are not authorized.');
    }

    var jwtData = waterlock._utils.createJwt(req, res);

    Jwt.create({ token: jwtData.token, jwt_id: (req.session.user.ID || req.session.user.id),revoked:false }).then(function () {
        var result = {};

        if (waterlock.config.jsonWebTokens.hasOwnProperty('tokenProperty')) {
            result[waterlock.config.jsonWebTokens.tokenProperty] = jwtData.token || 'token';
        }

        if (waterlock.config.jsonWebTokens.hasOwnProperty('expiresProperty')) {
            result[waterlock.config.jsonWebTokens.expiresProperty] = jwtData.expires || 'expires';
        }

        if (waterlock.config.jsonWebTokens.includeUserInJwtResponse) {
            result['user'] = req.session.user;
        }

        res.json(result);
    }).catch(function (err) {
        if (err) {
            waterlock.logger.debug(err);
            return res.serverError('JSON web token could not be created');
        }
    })

    ;
};
