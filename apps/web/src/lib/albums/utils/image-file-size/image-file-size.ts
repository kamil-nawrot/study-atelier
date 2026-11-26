import type { ImageSize } from '#lib/catalogue/types/image-size.ts';

function text(bytes: Uint8Array, start: number, length: number): string {
	return String.fromCharCode(...bytes.subarray(start, start + length));
}

function webpSize(bytes: Uint8Array, view: DataView): ImageSize | undefined {
	const chunk = text(bytes, 12, 4);
	if (chunk === 'VP8X') {
		const width = 1 + (view.getUint32(24, true) & 0xffffff);
		const height = 1 + (view.getUint32(27, true) & 0xffffff);
		return { width, height };
	}
	if (chunk === 'VP8L') {
		const bits = view.getUint32(21, true);
		return { width: (bits & 0x3fff) + 1, height: ((bits >> 14) & 0x3fff) + 1 };
	}
	if (chunk === 'VP8 ') {
		return { width: view.getUint16(26, true) & 0x3fff, height: view.getUint16(28, true) & 0x3fff };
	}
	return undefined;
}

function jpegSize(bytes: Uint8Array, view: DataView): ImageSize | undefined {
	let offset = 2;
	while (offset + 9 < bytes.length) {
		if (bytes[offset] !== 0xff) return undefined;
		const marker = bytes[offset + 1];
		const frame = marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker);
		if (frame) return { height: view.getUint16(offset + 5), width: view.getUint16(offset + 7) };
		offset += 2 + view.getUint16(offset + 2);
	}
	return undefined;
}

export function imageFileSize(bytes: Uint8Array): ImageSize | undefined {
	if (bytes.length < 30) return undefined;
	const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
	if (text(bytes, 0, 4) === 'RIFF' && text(bytes, 8, 4) === 'WEBP') return webpSize(bytes, view);
	if (text(bytes, 1, 3) === 'PNG') return { width: view.getUint32(16), height: view.getUint32(20) };
	if (bytes[0] === 0xff && bytes[1] === 0xd8) return jpegSize(bytes, view);
	return undefined;
}
