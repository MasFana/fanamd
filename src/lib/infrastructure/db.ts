import { Surreal } from 'surrealdb';

export const db = new Surreal();
export let isConnected = false;
export async function connectDB() {
	try {
		if (!isConnected) {
			await db.connect(process.env.SURREAL_URL || 'ws://127.0.0.1:8000/rpc');
			await db.signin({
				username: process.env.SURREAL_USER || 'root',
				password: process.env.SURREAL_PASS || 'root'
			});
			await db.use({
				namespace: process.env.SURREAL_NS || 'test',
				database: process.env.SURREAL_DB || 'test'
			});
			await db.ready;
			isConnected = true;
		}
	} catch (err) {
		console.error('❌ SurrealDB Connection Error:', err);
		isConnected = false;
		throw err;
	}
}
