import assert from 'node:assert/strict';
import { mkdtemp, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { describe, it } from 'node:test';
import { downloadBucket, uploadBucket } from './copy-bucket.mjs';
import { contentTypeOf, storageApi } from './storage/storage-api.mjs';

function fakeStorage(files) {
	const uploads = new Map();
	const requests = [];
	async function fetch(url, init) {
		const { pathname } = new URL(url);
		requests.push({ pathname, init });
		if (pathname === '/storage/v1/object/list/artwork-images') {
			const { prefix, offset } = JSON.parse(init.body);
			const names = new Set();
			const entries = [];
			for (const file of Object.keys(files).filter((name) => name.startsWith(prefix))) {
				const rest = prefix ? file.slice(prefix.length + 1) : file;
				const [first, ...more] = rest.split('/');
				if (names.has(first)) continue;
				names.add(first);
				entries.push({ name: first, id: more.length > 0 ? null : `id-${file}` });
			}
			return Response.json(entries.slice(offset, offset + 1000));
		}
		const object = decodeURI(pathname.replace('/storage/v1/object/artwork-images/', ''));
		if (init?.method === 'POST') {
			uploads.set(object, { bytes: init.body, type: init.headers['Content-Type'] });
			return new Response('{}');
		}
		return new Response(files[object]);
	}
	return {
		api: storageApi({ url: 'https://project.supabase.co', key: 'secret', fetch }),
		uploads,
		requests
	};
}

describe('copy-bucket', () => {
	it('downloads every file of every owner folder and uploads them back', async () => {
		const files = {
			'owner-a/one.jpg': 'one',
			'owner-a/one-thumb.jpg': 'thumb',
			'owner-b/avatar-x.jpg': 'avatar'
		};
		const source = fakeStorage(files);
		const folder = await mkdtemp(path.join(tmpdir(), 'bucket-'));

		assert.equal(await downloadBucket(source.api, folder, () => {}), 3);
		assert.equal(await readFile(path.join(folder, 'owner-a/one.jpg'), 'utf8'), 'one');
		assert.ok(source.requests.every(({ init }) => init?.headers?.apikey === 'secret'));

		const target = fakeStorage({});
		assert.equal(await uploadBucket(target.api, folder, () => {}), 3);
		assert.deepEqual([...target.uploads.keys()].sort(), Object.keys(files).sort());
		assert.equal(target.uploads.get('owner-b/avatar-x.jpg').type, 'image/jpeg');
	});

	it('names the content type of an image by its extension', () => {
		assert.equal(contentTypeOf('a/b.webp'), 'image/webp');
		assert.equal(contentTypeOf('a/b.PNG'), 'image/png');
		assert.equal(contentTypeOf('a/b.bin'), 'application/octet-stream');
	});
});
