'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});

var _objectWithoutProperties2 = require('babel-runtime/helpers/objectWithoutProperties');

var _objectWithoutProperties3 = _interopRequireDefault(_objectWithoutProperties2);

var _extends2 = require('babel-runtime/helpers/extends');

var _extends3 = _interopRequireDefault(_extends2);

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require('babel-runtime/helpers/createClass');

var _createClass3 = _interopRequireDefault(_createClass2);

var _Session = require('./Session');

var _Session2 = _interopRequireDefault(_Session);

var _jsonwebtoken = require('jsonwebtoken');

var _jsonwebtoken2 = _interopRequireDefault(_jsonwebtoken);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var SessionManager = function () {
	(0, _createClass3.default)(SessionManager, null, [{
		key: 'authorizationHeaderTokenParser',
		value: function authorizationHeaderTokenParser(req) {
			var headerFunc = req.header || req.get;
			var tokenBearer = headerFunc.call(req, 'authorization');
			if (!tokenBearer) {
				return null;
			} else {
				return tokenBearer.slice('bearer '.length);
			}
		}
	}]);

	function SessionManager() {
		var options = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];
		(0, _classCallCheck3.default)(this, SessionManager);
		this.options = {
			secret: '',
			client: null,
			algorithm: 'HS256',
			keyspace: 'session:',
			requestKey: 'session',
			maxAge: 86400,
			tokenParser: SessionManager.authorizationHeaderTokenParser
		};

		this.options = (0, _extends3.default)({}, this.options, options);
	}

	(0, _createClass3.default)(SessionManager, [{
		key: 'parseToken',
		value: function parseToken(req) {
			return this.options.tokenParser && this.options.tokenParser(req) || null;
		}
	}, {
		key: 'middleware',
		value: function middleware(req, res, next) {
			var _options = this.options;
			var requestKey = _options.requestKey;
			var secret = _options.secret;
			var keyspace = _options.keyspace;


			var session = new _Session2.default(this);

			req[requestKey] = session;

			var token = this.parseToken(req);

			if (!token) {
				return next();
			}

			var decodedToken = {};
			try {
				// Do this sync - might as well
				decodedToken = _jsonwebtoken2.default.verify(token, secret);
			} catch (e) {
				decodedToken = {};
			}

			if (!decodedToken.jti) {
				return next();
			}

			this.client.get('' + keyspace + decodedToken.jti, function (err, sessionData) {
				if (err || !sessionData) {
					return next();
				}

				try {
					sessionData = JSON.parse(sessionData);
				} catch (e) {
					return next();
				}

				// Clears out non-claims data
				var _sessionData = sessionData;
				var jti = _sessionData.jti;
				var oldToken = _sessionData.token;
				var claims = (0, _objectWithoutProperties3.default)(_sessionData, ['jti', 'token']);


				session.put(decodedToken.jti, token, claims);
				session.touch().then(function () {
					return next();
				}).catch(next);
			});
		}
	}, {
		key: 'client',
		get: function get() {
			return this.options.client;
		}
	}]);
	return SessionManager;
}();

exports.default = SessionManager;