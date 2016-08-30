(function() { 'use strict';

// *****************************************************************************
// Includes and definitions
// *****************************************************************************

var _     = require('lodash');
var jwt   = require('jsonwebtoken');
var utils = require('./utils');

// *****************************************************************************
// Exports
// *****************************************************************************

module.exports = init;

// *****************************************************************************
// Package functions
// *****************************************************************************

/**
 * Package function to initialize the package.
 *
 * @public
 * @param {Object} options  object of the options to init the package with
 */
function init(options) {
    var SessionUtils, requestHeader, token;

    if(!options.client || !options.secret) {
        throw new Error('Redis client and secret required for JWT Redis Session!');
    }
    
    function getTokenDefault(req, requestHeader, requestArg) {
        return req.get(requestHeader)             ||
            (req.query  && req.query[requestArg]) ||
            (req.body   && req.body[requestArg]);
    }

    options = {
        client    : options.client,
        secret    : options.secret,
        algorithm : options.algorithm  || 'HS256',
        keyspace  : options.keyspace   || 'sess:',
        requestKey: options.requestKey || 'session',
        requestArg: options.requestArg || 'accessToken',
        maxAge    : options.maxAge     || 86400,
		getToken  : options.getToken   || getTokenDefault
    };

    SessionUtils  = utils(options);
    requestHeader = _.reduce(options.requestArg.split(''), function(memo, ch) {
        return memo + (ch.toUpperCase() === ch ? '-' + ch.toLowerCase() : ch);
    }, 'x' + (options.requestArg.charAt(0) === options.requestArg.charAt(0).toUpperCase() ? '' : '-'));

    return function jwtRedisSession(req, res, next) {

        req[options.requestKey] = new SessionUtils();

        token = options.getToken(req, requestHeader, options.requestArg);

        if (!token) {
            return next();
        }

        return jwt.verify(token, options.secret, function(error, decoded) {
            if (error || !decoded.jti) {
                return next();
            }

            return options.client.get(options.keyspace + decoded.jti, function(err, session) {
                if (err || !session) {
                    return next(); 
                }
                try {
                    session = JSON.parse(session);
                } catch(e) {
                    return next();
                }

                _.extend(req[options.requestKey], session);
                req[options.requestKey].claims = decoded;
                req[options.requestKey].id     = decoded.jti;
                req[options.requestKey].jwt    = token;
                req[options.requestKey].touch(_.noop); // Update the TTL
                return next();
            });
        });
    };
}

// *****************************************************************************

})();