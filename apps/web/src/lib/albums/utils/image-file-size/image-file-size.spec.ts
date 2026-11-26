import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { imageFileSize } from './image-file-size.ts';

function bytes(length: number, fill: (view: DataView, bytes: Uint8Array) => void): Uint8Array {
	const data = new Uint8Array(length);
	fill(new DataView(data.buffer), data);
	return data;
}

function ascii(data: Uint8Array, offset: number, text: string): void {
	data.set(
		[...text].map((character) => character.charCodeAt(0)),
		offset
	);
}

describe('imageFileSize', () => {
	it('reads the size of a lossy WebP file', () => {
		const file = readFileSync('static/albums/sample-album/images/spiral-study.webp');

		expect(imageFileSize(new Uint8Array(file))).toEqual({ width: 600, height: 800 });
	});

	it('reads the size of an extended and a lossless WebP file', () => {
		const extended = bytes(40, (view, data) => {
			ascii(data, 0, 'RIFF');
			ascii(data, 8, 'WEBPVP8X');
			view.setUint32(24, 1199, true);
			view.setUint32(27, 799, true);
		});
		const lossless = bytes(40, (view, data) => {
			ascii(data, 0, 'RIFF');
			ascii(data, 8, 'WEBPVP8L');
			view.setUint32(21, 299 | (149 << 14), true);
		});

		expect(imageFileSize(extended)).toEqual({ width: 1200, height: 800 });
		expect(imageFileSize(lossless)).toEqual({ width: 300, height: 150 });
	});

	it('reads the size of a PNG and of a JPEG file after its other segments', () => {
		const png = bytes(40, (view, data) => {
			data.set([0x89], 0);
			ascii(data, 1, 'PNG');
			view.setUint32(16, 640);
			view.setUint32(20, 480);
		});
		const jpeg = bytes(40, (view, data) => {
			data.set([0xff, 0xd8, 0xff, 0xe0], 0);
			view.setUint16(4, 8);
			data.set([0xff, 0xc0], 12);
			view.setUint16(17, 720);
			view.setUint16(19, 1280);
		});

		expect(imageFileSize(png)).toEqual({ width: 640, height: 480 });
		expect(imageFileSize(jpeg)).toEqual({ width: 1280, height: 720 });
	});

	it('has no size for a file that is no image it knows', () => {
		expect(
			imageFileSize(new TextEncoder().encode('{"format": 1, "albums": []}    '))
		).toBeUndefined();
		expect(imageFileSize(new Uint8Array(4))).toBeUndefined();
	});
});
