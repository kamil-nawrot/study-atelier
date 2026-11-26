import { describe, expect, it } from 'vitest';
import { albumEntryKey, parseAlbumEntry } from './album-entry.ts';

describe('album entry keys', () => {
	it('joins the album and the entry with a slash and reads them back', () => {
		const key = albumEntryKey({ slug: 'sample-album', entryId: 'spiral-study' });

		expect(key).toBe('sample-album/spiral-study');
		expect(parseAlbumEntry(key)).toEqual({ slug: 'sample-album', entryId: 'spiral-study' });
	});

	it.each([null, '', 'sample-album', 'sample-album/', 'a/b/c', 'Sample/x', '../x'])(
		'refuses %j',
		(key) => {
			expect(parseAlbumEntry(key)).toBeNull();
		}
	);
});
