import _ from 'lodash'
import jwt from 'jsonwebtoken'
import uuid from 'node-uuid'

export default class Session {
	sessionManager = null;

	jti = '';
	token = '';
	claims = {};

	static getKeyName(keyspace, id) {
		return `${keyspace}${id}`;
	}

	constructor(sessionManager) {
		this.sessionManager = sessionManager;
	}

	getLocalKeyName() {
		const {sessionManager, jti} = this;
		const {keyspace} = sessionManager.options;
		return Session.getKeyName(keyspace, jti);
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

		const cache = JSON.stringify({
			...tokenComponents,
			token
		});

		return new Promise((resolve, reject) => {
			this.sessionManager.client.setex(Session.getKeyName(keyspace, jti),	maxAge, cache, err => {
				if (err) {
					reject(err);
				}

				this.put(jti, token, claims);

				resolve(token);
			});
		})
	}

	async touch() {
		if (!this.jti) {
			throw new Error('Invalid session ID');
		}

		const {maxAge} = this.sessionManager.options;

		return new Promise((resolve, reject) => {
			this.sessionManager.client.expire(this.getLocalKeyName(), maxAge, err => {
				if (err) {
					reject(err);
				}

				resolve();
			});
		})
	}

	async destroy() {
		if (!this.jti) {
			throw new Error('Invalid session ID');
		}

		return new Promise((resolve, reject) => {
			this.sessionManager.client.del(this.getLocalKeyName(), err => {
				if (err) {
					reject(err);
				}

				resolve();
			})
		})
	}
}