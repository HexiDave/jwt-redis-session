'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});

var _promise = require('babel-runtime/core-js/promise');

var _promise2 = _interopRequireDefault(_promise);

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _stringify = require('babel-runtime/core-js/json/stringify');

var _stringify2 = _interopRequireDefault(_stringify);

var _extends2 = require('babel-runtime/helpers/extends');

var _extends3 = _interopRequireDefault(_extends2);

var _asyncToGenerator2 = require('babel-runtime/helpers/asyncToGenerator');

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require('babel-runtime/helpers/createClass');

var _createClass3 = _interopRequireDefault(_createClass2);

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _jsonwebtoken = require('jsonwebtoken');

var _jsonwebtoken2 = _interopRequireDefault(_jsonwebtoken);

var _nodeUuid = require('node-uuid');

var _nodeUuid2 = _interopRequireDefault(_nodeUuid);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var Session = function () {
	(0, _createClass3.default)(Session, null, [{
		key: 'getKeyName',
		value: function getKeyName(keyspace, id) {
			return '' + keyspace + id;
		}
	}]);

	function Session(sessionManager) {
		(0, _classCallCheck3.default)(this, Session);
		this.sessionManager = null;
		this.id = '';
		this.token = '';
		this.claims = {};

		this.sessionManager = sessionManager;
	}

	(0, _createClass3.default)(Session, [{
		key: 'put',
		value: function put(jti, token) {
			var claims = arguments.length <= 2 || arguments[2] === undefined ? {} : arguments[2];

			this.jti = jti;
			this.token = token;
			this.claims = claims;

			return this;
		}
	}, {
		key: 'create',
		value: function () {
			var _ref = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee() {
				var _this = this;

				var claims = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

				var _sessionManager$optio, secret, keyspace, maxAge, algorithm, jti, tokenComponents, token;

				return _regenerator2.default.wrap(function _callee$(_context) {
					while (1) {
						switch (_context.prev = _context.next) {
							case 0:
								_sessionManager$optio = this.sessionManager.options;
								secret = _sessionManager$optio.secret;
								keyspace = _sessionManager$optio.keyspace;
								maxAge = _sessionManager$optio.maxAge;
								algorithm = _sessionManager$optio.algorithm;
								jti = _nodeUuid2.default.v4();
								tokenComponents = (0, _extends3.default)({}, claims, {
									jti: jti
								});
								token = _jsonwebtoken2.default.sign(tokenComponents, secret, { algorithm: algorithm });


								this.sessionManager.client.setex(Session.getKeyName(keyspace, jti), maxAge, (0, _stringify2.default)((0, _extends3.default)({}, tokenComponents, {
									token: token
								}), function (err) {
									if (err) {
										throw err;
									}

									_this.put(jti, token, claims);

									return token;
								}));

							case 9:
							case 'end':
								return _context.stop();
						}
					}
				}, _callee, this);
			}));

			function create(_x2) {
				return _ref.apply(this, arguments);
			}

			return create;
		}()
	}, {
		key: 'touch',
		value: function () {
			var _ref2 = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee2() {
				var _sessionManager$optio2, keyspace, maxAge;

				return _regenerator2.default.wrap(function _callee2$(_context2) {
					while (1) {
						switch (_context2.prev = _context2.next) {
							case 0:
								if (this.id) {
									_context2.next = 2;
									break;
								}

								throw new Error('Invalid session ID');

							case 2:
								_sessionManager$optio2 = this.sessionManager.options;
								keyspace = _sessionManager$optio2.keyspace;
								maxAge = _sessionManager$optio2.maxAge;


								this.sessionManager.client.expire(Session.getKeyName(keyspace, this.jti), maxAge, function (err) {
									if (err) {
										throw err;
									}

									_promise2.default.resolve();
								});

							case 6:
							case 'end':
								return _context2.stop();
						}
					}
				}, _callee2, this);
			}));

			function touch() {
				return _ref2.apply(this, arguments);
			}

			return touch;
		}()
	}]);
	return Session;
}();

exports.default = Session;