const PAGE = 1000;

const CONTENT_TYPES = {
	jpg: 'image/jpeg',
	jpeg: 'image/jpeg',
	png: 'image/png',
	webp: 'image/webp',
	gif: 'image/gif',
	avif: 'image/avif'
};

export function contentTypeOf(path) {
	const extension = path.slice(path.lastIndexOf('.') + 1).toLowerCase();
	return CONTENT_TYPES[extension] ?? 'application/octet-stream';
}

export function storageApi({ url, key, fetch = globalThis.fetch }) {
	async function call(path, init = {}) {
		const response = await fetch(`${url}${path}`, {
			...init,
			headers: { apikey: key, ...init.headers }
		});
		if (!response.ok) {
			throw new Error(
				`${init.method ?? 'GET'} ${path}: ${response.status} ${await response.text()}`
			);
		}
		return response;
	}

	function json(method, path, body) {
		return call(path, {
			method,
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(body)
		});
	}

	async function list(bucket, prefix) {
		const entries = [];
		for (let offset = 0; ; offset += PAGE) {
			const response = await json('POST', `/storage/v1/object/list/${bucket}`, {
				prefix,
				limit: PAGE,
				offset,
				sortBy: { column: 'name', order: 'asc' }
			});
			const page = await response.json();
			entries.push(...page);
			if (page.length < PAGE) return entries;
		}
	}

	async function listAll(bucket, prefix = '') {
		const paths = [];
		for (const entry of await list(bucket, prefix)) {
			const path = prefix ? `${prefix}/${entry.name}` : entry.name;
			if (entry.id === null) paths.push(...(await listAll(bucket, path)));
			else paths.push(path);
		}
		return paths;
	}

	return {
		async deletedAccountImages() {
			return (await json('POST', '/rest/v1/rpc/deleted_account_images', {})).json();
		},
		async unusedImages() {
			return (await json('POST', '/rest/v1/rpc/unused_images', {})).json();
		},
		async remove(bucket, paths) {
			await json('DELETE', `/storage/v1/object/${bucket}`, { prefixes: paths });
		},
		listAll,
		async download(bucket, path) {
			const response = await call(`/storage/v1/object/${bucket}/${encodeURI(path)}`);
			return new Uint8Array(await response.arrayBuffer());
		},
		async upload(bucket, path, bytes) {
			await call(`/storage/v1/object/${bucket}/${encodeURI(path)}`, {
				method: 'POST',
				headers: { 'Content-Type': contentTypeOf(path), 'x-upsert': 'true' },
				body: bytes
			});
		}
	};
}

export function storageApiFromEnv() {
	const url = process.env.SUPABASE_URL;
	const key = process.env.SUPABASE_SECRET_KEY;
	if (!url || !key) throw new Error('SUPABASE_URL and SUPABASE_SECRET_KEY are required');
	return storageApi({ url, key });
}
