import _ from 'lodash'
import jwt from 'jsonwebtoken'
import uuid from 'node-uuid'

export default class Session {
	sessionManager = null;

	id = '';
	token = '';
	claims = {};

	static getKeyName(keyspace, id) {
		return `${keyspace}${id}`;
	}

	constructor(sessionManager) {
		this.sessionManager = sessionManager;
	}

	put(jti, token, claims = {}) {
		this.jti = jti;
		this.token = token;
		this.claims = claims;

		return this;
	}

	async create(claims = {}) {
		const {secret, keyspace, maxAge, algorithm} = this.sessionManager.options;

		const jti = uuid.v4();
		const tokenComponents = {
			...claims,
			jti
		};

		const token = jwt.sign(tokenComponents, secret, {algorithm});

		this.sessionManager.client.setex(
			Session.getKeyName(keyspace, jti),
			maxAge,
			JSON.stringify({
				...tokenComponents,
				token
			}, err => {
				if (err) {
					throw err;
				}

				this.jti = jti;

				return token;
			})
		)
	}

	async touch() {
		if (!this.id) {
			throw new Error('Invalid session ID');
		}

		const {keyspace, maxAge} = this.sessionManager.options;

		this.sessionManager.client.expire(Session.getKeyName(keyspace, this.jti), maxAge, err => {
			if (err) {
				throw err;
			}

			Promise.resolve();
		})
	}
}