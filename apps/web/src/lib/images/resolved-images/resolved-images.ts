import { SIGNED_URL_SECONDS } from '#lib/images/bucket/bucket.ts';
import { readStoredJson, writeStored } from '#lib/shared/utils/storage/storage.ts';

export const SIGNED_URLS_KEY = 'study-atelier:signed-images';

type SignedImageUrl = {
	url: string;
	signedAt: number;
};

type StoredSignedUrls = {
	learner: string;
	urls: Record<string, SignedImageUrl>;
};

function isSignedImageUrl(value: unknown): value is SignedImageUrl {
	if (typeof value !== 'object' || value === null) return false;
	const { url, signedAt } = value as Record<string, unknown>;
	return typeof url === 'string' && typeof signedAt === 'number';
}

function storedSignedUrls(): StoredSignedUrls | undefined {
	const stored = readStoredJson('local', SIGNED_URLS_KEY);
	if (typeof stored !== 'object' || stored === null) return undefined;
	const { learner, urls } = stored as Record<string, unknown>;
	if (typeof learner !== 'string' || typeof urls !== 'object' || urls === null) return undefined;
	const valid = Object.entries(urls).filter(([, signed]) => isSignedImageUrl(signed));
	return { learner, urls: Object.fromEntries(valid) as Record<string, SignedImageUrl> };
}

const REUSE_MARGIN_MS = 60 * 60 * 1000;

function isFresh(signed: SignedImageUrl, now: number): boolean {
	return now - signed.signedAt < SIGNED_URL_SECONDS * 1000 - REUSE_MARGIN_MS;
}

export class ResolvedImages {
	#thumbnails = new Map<string, string>();
	#signedUrls = new Map<string, SignedImageUrl>();
	#learner: string | undefined | null = null;

	thumbnail(file: string): string | undefined {
		return this.#thumbnails.get(file);
	}

	rememberThumbnails(thumbnails: Map<string, string>): void {
		for (const [file, url] of thumbnails) this.#thumbnails.set(file, url);
	}

	forLearner(learner: string | undefined, now: number = Date.now()): void {
		if (learner === this.#learner) return;
		const stored = storedSignedUrls();
		this.clear();
		this.#learner = learner;
		if (!learner || stored?.learner !== learner) return;
		for (const [path, signed] of Object.entries(stored.urls)) {
			if (isFresh(signed, now)) this.#signedUrls.set(path, signed);
		}
		this.#store(now);
	}

	signedUrl(path: string, now: number = Date.now()): SignedImageUrl | undefined {
		const signed = this.#signedUrls.get(path);
		if (!signed || !isFresh(signed, now)) return undefined;
		return signed;
	}

	rememberSignedUrls(urls: Map<string, string>, signedAt: number): void {
		if (urls.size === 0) return;
		for (const [path, url] of urls) this.#signedUrls.set(path, { url, signedAt });
		this.#store(signedAt);
	}

	clear(): void {
		this.#thumbnails.clear();
		this.#signedUrls.clear();
		writeStored('local', SIGNED_URLS_KEY, null);
	}

	#store(now: number): void {
		if (!this.#learner) return;
		const current = storedSignedUrls();
		const urls: Record<string, SignedImageUrl> = {};
		const others = current?.learner === this.#learner ? Object.entries(current.urls) : [];
		for (const [path, signed] of [...others, ...this.#signedUrls]) {
			const known = urls[path];
			if (isFresh(signed, now) && (!known || known.signedAt < signed.signedAt)) urls[path] = signed;
		}
		const stored: StoredSignedUrls = { learner: this.#learner, urls };
		writeStored('local', SIGNED_URLS_KEY, JSON.stringify(stored));
	}
}

export const resolvedImages = new ResolvedImages();
