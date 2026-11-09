import { publicHttpsUrl } from '#lib/images/public-url/public-url.ts';

export const IMAGE_PROXY_PATH = '/api/image-proxy';
export const IMAGE_PROXY_MAX_BYTES = 10 * 1024 * 1024;
export const IMAGE_PROXY_TIMEOUT_MS = 8000;
export const IMAGE_PROXY_MAX_REDIRECTS = 3;

export type ProxiedImage =
	| { ok: true; body: ReadableStream<Uint8Array>; contentType: string }
	| { ok: false; status: 400 | 413 | 415 | 502 };

type Fetcher = (input: string, init: RequestInit) => Promise<Response>;

function imageType(response: Response): string | undefined {
	const type = response.headers.get('content-type')?.split(';')[0]?.trim().toLowerCase();
	return type?.startsWith('image/') && type !== 'image/svg+xml' ? type : undefined;
}

function redirectTarget(response: Response, from: URL): string | null {
	const location = response.headers.get('location');
	if (!location) return null;
	try {
		return new URL(location, from).href;
	} catch {
		return null;
	}
}

function discard(response: Response): void {
	response.body?.cancel().catch(() => undefined);
}

function limited(body: ReadableStream<Uint8Array>): ReadableStream<Uint8Array> {
	let size = 0;
	return body.pipeThrough(
		new TransformStream<Uint8Array, Uint8Array>({
			transform(chunk, controller) {
				size += chunk.byteLength;
				if (size > IMAGE_PROXY_MAX_BYTES) controller.error(new Error('too large'));
				else controller.enqueue(chunk);
			}
		})
	);
}

function imageOf(response: Response): ProxiedImage {
	if (!response.ok || !response.body) return { ok: false, status: 502 };
	const contentType = imageType(response);
	if (!contentType) return { ok: false, status: 415 };
	const declared = Number(response.headers.get('content-length') ?? 0);
	if (declared > IMAGE_PROXY_MAX_BYTES) return { ok: false, status: 413 };
	return { ok: true, body: limited(response.body), contentType };
}

export async function fetchPublicImage(
	target: string | null,
	fetcher: Fetcher = fetch
): Promise<ProxiedImage> {
	let url = publicHttpsUrl(target);
	if (!url) return { ok: false, status: 400 };
	const signal = AbortSignal.timeout(IMAGE_PROXY_TIMEOUT_MS);
	for (let hop = 0; hop <= IMAGE_PROXY_MAX_REDIRECTS; hop += 1) {
		let response: Response;
		try {
			response = await fetcher(url.href, {
				method: 'GET',
				redirect: 'manual',
				headers: { accept: 'image/*' },
				signal
			});
		} catch {
			return { ok: false, status: 502 };
		}
		if (response.status >= 300 && response.status < 400) {
			discard(response);
			const next = publicHttpsUrl(redirectTarget(response, url));
			if (!next) return { ok: false, status: 502 };
			url = next;
			continue;
		}
		const result = imageOf(response);
		if (!result.ok) discard(response);
		return result;
	}
	return { ok: false, status: 502 };
}
