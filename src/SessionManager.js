import Session from './Session'
import jwt from 'jsonwebtoken'

export default class SessionManager {
	options = {
		secret: '',
		client: null,
		algorithm: 'HS256',
		keyspace: 'session:',
		requestKey: 'session',
		maxAge: 86400,
		tokenParser: SessionManager.authorizationHeaderTokenParser
	};

	static authorizationHeaderTokenParser(req) {
		const headerFunc = req.header || req.get;
		const tokenBearer = headerFunc('authorization');
		if (!tokenBearer) {
			return null;
		} else {
			return tokenBearer.slice('bearer '.length);
		}
	}

	constructor(options = {}) {
		this.options = {
			...this.options,
			...options // Overrides main options
		}
	}

	get client() {
		return this.options.client;
	}

	parseToken(req) {
		return (this.options.tokenParser && this.options.tokenParser(req)) || null;
	}

	middleware(req, res, next) {
		const {requestKey, secret, keyspace} = this.options;

		const session = new Session(this);

		req[requestKey] = session;

		const token = this.parseToken(req);

		if (!token) {
			return next();
		}

		let decodedToken = {};
		try {
			// Do this sync - might as well
			decodedToken = jwt.verify(token, secret);
		} catch (e) {
			decodedToken = {};
		}

		if (!decodedToken.jti) {
			return next();
		}

		this.client.get(`${keyspace}${decodedToken.jti}`, (err, sessionData) => {
			if (err || !sessionData) {
				return next();
			}

			try {
				sessionData = JSON.parse(sessionData);
			} catch (e) {
				return next();
			}


			session.put(decodedToken.jti, token, sessionData.claims);
			session.touch().then(() => next()).catch(next);
		});
	}
}