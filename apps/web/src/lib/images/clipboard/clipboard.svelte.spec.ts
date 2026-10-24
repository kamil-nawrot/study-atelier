import { afterEach, describe, expect, it, vi } from 'vitest';
import {
	contentFromPasteEvent,
	pasteShortcut,
	pastedImageFrom,
	readClipboard,
	type ClipboardContent
} from './clipboard.ts';

vi.mock('#lib/shared/data/supabase/supabase.ts', () => ({ supabase: {} }));

function content(parts: Partial<ClipboardContent>): ClipboardContent {
	return { images: [], text: '', html: '', ...parts };
}

function png(): Blob {
	return new Blob([new Uint8Array(10)], { type: 'image/png' });
}

function stubClipboard(read: () => Promise<ClipboardItem[]> | undefined): void {
	vi.stubGlobal('navigator', { ...navigator, platform: 'Win32', clipboard: { read } });
}

describe('pastedImageFrom', () => {
	it('prefers an image over an address', () => {
		const pasted = pastedImageFrom(content({ images: [png()], text: 'https://example.com/a.jpg' }));

		expect(pasted).toMatchObject({ file: { type: 'image/png', name: 'pasted-image.png' } });
	});

	it('uses an https address as text', () => {
		const pasted = pastedImageFrom(content({ text: ' https://example.com/milkmaid.jpg\n' }));

		expect(pasted).toEqual({ url: 'https://example.com/milkmaid.jpg' });
	});

	it('ignores text that is not a single https address', () => {
		expect(pastedImageFrom(content({ text: 'http://example.com/a.jpg' }))).toBeUndefined();
		expect(pastedImageFrom(content({ text: 'The Milkmaid' }))).toBeUndefined();
		expect(pastedImageFrom(content({ text: 'https://example.com/a b' }))).toBeUndefined();
		expect(pastedImageFrom(content({ text: '' }))).toBeUndefined();
	});

	it('falls back to the source of an image in copied html', () => {
		const html = '<p>Look</p><img alt="x" src="https://example.com/milkmaid.png">';

		expect(pastedImageFrom(content({ html }))).toEqual({
			url: 'https://example.com/milkmaid.png'
		});
	});

	it('ignores html images that are not served over https', () => {
		expect(pastedImageFrom(content({ html: '<img src="data:image/png;base64,AAAA">' }))).toBe(
			undefined
		);
		expect(pastedImageFrom(content({ html: '<p>No image</p>' }))).toBeUndefined();
	});

	it('keeps the type of an image the bucket does not take so it can be rejected', () => {
		const pasted = pastedImageFrom(content({ images: [new Blob(['x'], { type: 'image/bmp' })] }));

		expect(pasted).toMatchObject({ file: { type: 'image/bmp', name: 'pasted-image.img' } });
	});
});

describe('contentFromPasteEvent', () => {
	it('collects image files, text and html', () => {
		const data = new DataTransfer();
		data.items.add(new File(['x'], 'a.png', { type: 'image/png' }));
		data.items.add(new File(['x'], 'a.txt', { type: 'text/plain' }));
		data.setData('text/plain', 'https://example.com/a.png');

		const result = contentFromPasteEvent(data);

		expect(result.images.map((file) => file.type)).toEqual(['image/png']);
		expect(result.text).toBe('https://example.com/a.png');
		expect(result.html).toBe('');
	});
});

describe('readClipboard', () => {
	afterEach(() => {
		vi.unstubAllGlobals();
	});

	it('reads an image, text and html from clipboard items', async () => {
		stubClipboard(async () => [
			new ClipboardItem({ 'image/png': png(), 'text/plain': new Blob(['https://example.com/a']) })
		]);

		const result = await readClipboard();

		expect('content' in result && result.content.images).toHaveLength(1);
		expect('content' in result && result.content.text).toBe('https://example.com/a');
	});

	it('reports a refused read', async () => {
		stubClipboard(async () => {
			throw new DOMException('Denied', 'NotAllowedError');
		});

		expect(await readClipboard()).toEqual({ denied: true });
	});

	it('reports a browser without the clipboard API', async () => {
		vi.stubGlobal('navigator', { platform: 'Win32' });

		expect(await readClipboard()).toEqual({ denied: true });
	});
});

describe('pasteShortcut', () => {
	afterEach(() => {
		vi.unstubAllGlobals();
	});

	it('names Ctrl+V outside macOS', () => {
		vi.stubGlobal('navigator', { platform: 'Win32' });

		expect(pasteShortcut()).toEqual({ keys: ['Ctrl', 'V'], label: 'Ctrl+V' });
	});

	it('names ⌘V on a Mac', () => {
		vi.stubGlobal('navigator', { platform: 'MacIntel' });

		expect(pasteShortcut()).toEqual({ keys: ['⌘', 'V'], label: '⌘V' });
	});
});
