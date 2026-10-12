import { OWN_IMAGE_EXTENSIONS, isOwnImageType } from './bucket.ts';
import { parseImageUrl } from './own-image.ts';

export type ClipboardContent = {
	images: Blob[];
	text: string;
	html: string;
};

export type PastedImage = { file: File } | { url: string };

export type ClipboardReadResult = { content: ClipboardContent } | { denied: true };

export type PasteShortcut = { keys: string[]; label: string };

export function pasteShortcut(): PasteShortcut {
	const onMac = /mac|iphone|ipad/i.test(navigator.platform ?? '');
	const keys = onMac ? ['⌘', 'V'] : ['Ctrl', 'V'];
	return { keys, label: keys.join(onMac ? '' : '+') };
}

function imageFile(blob: Blob): File {
	const extension = isOwnImageType(blob.type) ? OWN_IMAGE_EXTENSIONS[blob.type] : 'img';
	return new File([blob], `pasted-image.${extension}`, { type: blob.type });
}

function addressFrom(text: string): string | undefined {
	const value = text.trim();
	if (value === '' || /\s/.test(value)) return undefined;
	const parsed = parseImageUrl(value);
	return 'url' in parsed ? parsed.url : undefined;
}

function sourceFrom(html: string): string | undefined {
	if (html === '') return undefined;
	const source = new DOMParser()
		.parseFromString(html, 'text/html')
		.querySelector('img')
		?.getAttribute('src');
	return source ? addressFrom(source) : undefined;
}

export function pastedImageFrom(content: ClipboardContent): PastedImage | undefined {
	const [image] = content.images;
	if (image) return { file: imageFile(image) };
	const url = addressFrom(content.text) ?? sourceFrom(content.html);
	return url ? { url } : undefined;
}

export function contentFromPasteEvent(data: DataTransfer): ClipboardContent {
	return {
		images: Array.from(data.files).filter((file) => file.type.startsWith('image/')),
		text: data.getData('text/plain'),
		html: data.getData('text/html')
	};
}

async function readText(item: ClipboardItem, type: string): Promise<string> {
	return item.types.includes(type) ? (await item.getType(type)).text() : '';
}

export async function readClipboard(): Promise<ClipboardReadResult> {
	if (!navigator.clipboard?.read) return { denied: true };
	try {
		const items = await navigator.clipboard.read();
		const content: ClipboardContent = { images: [], text: '', html: '' };
		for (const item of items) {
			const imageType = item.types.find((type) => type.startsWith('image/'));
			if (imageType) content.images.push(await item.getType(imageType));
			content.text ||= await readText(item, 'text/plain');
			content.html ||= await readText(item, 'text/html');
		}
		return { content };
	} catch {
		return { denied: true };
	}
}
