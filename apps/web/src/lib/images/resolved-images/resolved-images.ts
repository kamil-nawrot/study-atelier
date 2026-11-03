import { SIGNED_URL_SECONDS } from '#lib/images/bucket/bucket.ts';
import { readStoredJson, writeStored } from '#lib/shared/utils/storage/storage.ts';

export const SIGNED_URLS_KEY = 'study-atelier:signed-images';
export const THUMBNAILS_KEY = 'study-atelier:commons-thumbnails';

const REUSE_MARGIN_MS = 60 * 60 * 1000;
const SIGNED_URL_LIFETIME_MS = SIGNED_URL_SECONDS * 1000 - REUSE_MARGIN_MS;
const THUMBNAIL_LIFETIME_MS = 7 * 24 * 60 * 60 * 1000;

type SignedImageUrl = {
	url: string;
	signedAt: number;
};

type RememberedUrl = {
	url: string;
	at: number;
};

type StoredUrls = {
	learner: string;
	urls: Record<string, RememberedUrl>;
};

function isRememberedUrl(value: unknown): value is RememberedUrl {
	if (typeof value !== 'object' || value === null) return false;
	const { url, at } = value as Record<string, unknown>;
	return typeof url === 'string' && typeof at === 'number';
}

function storedUrls(key: string): StoredUrls | undefined {
	const stored = readStoredJson('local', key);
	if (typeof stored !== 'object' || stored === null) return undefined;
	const { learner, urls } = stored as Record<string, unknown>;
	if (typeof learner !== 'string' || typeof urls !== 'object' || urls === null) return undefined;
	const valid = Object.entries(urls).filter(([, remembered]) => isRememberedUrl(remembered));
	return { learner, urls: Object.fromEntries(valid) as Record<string, RememberedUrl> };
}

class DeviceUrls {
	#urls = new Map<string, RememberedUrl>();
	#key: string;
	#lifetime: number;

	constructor(key: string, lifetime: number) {
		this.#key = key;
		this.#lifetime = lifetime;
	}

	get(name: string, now: number): RememberedUrl | undefined {
		const remembered = this.#urls.get(name);
		return remembered && this.#isFresh(remembered, now) ? remembered : undefined;
	}

	read(): StoredUrls | undefined {
		return storedUrls(this.#key);
	}

	restore(stored: StoredUrls | undefined, learner: string, now: number): void {
		if (stored?.learner !== learner) return;
		for (const [name, remembered] of Object.entries(stored.urls)) {
			if (this.#isFresh(remembered, now)) this.#urls.set(name, remembered);
		}
		this.store(learner, now);
	}

	remember(urls: Map<string, string>, at: number): void {
		for (const [name, url] of urls) this.#urls.set(name, { url, at });
	}

	store(learner: string | undefined, now: number): void {
		if (!learner) return;
		const current = storedUrls(this.#key);
		const urls: Record<string, RememberedUrl> = {};
		const others = current?.learner === learner ? Object.entries(current.urls) : [];
		for (const [name, remembered] of [...others, ...this.#urls]) {
			const known = urls[name];
			if (this.#isFresh(remembered, now) && (!known || known.at < remembered.at)) {
				urls[name] = remembered;
			}
		}
		writeStored('local', this.#key, JSON.stringify({ learner, urls }));
	}

	clear(): void {
		this.#urls.clear();
		writeStored('local', this.#key, null);
	}

	#isFresh(remembered: RememberedUrl, now: number): boolean {
		return now - remembered.at < this.#lifetime;
	}
}

export class ResolvedImages {
	#thumbnails = new DeviceUrls(THUMBNAILS_KEY, THUMBNAIL_LIFETIME_MS);
	#signedUrls = new DeviceUrls(SIGNED_URLS_KEY, SIGNED_URL_LIFETIME_MS);
	#learner: string | undefined | null = null;

	thumbnail(file: string, now: number = Date.now()): string | undefined {
		return this.#thumbnails.get(file, now)?.url;
	}

	rememberThumbnails(thumbnails: Map<string, string>, now: number = Date.now()): void {
		if (thumbnails.size === 0) return;
		this.#thumbnails.remember(thumbnails, now);
		this.#thumbnails.store(this.#learner ?? undefined, now);
	}

	forLearner(learner: string | undefined, now: number = Date.now()): void {
		if (learner === this.#learner) return;
		const thumbnails = this.#thumbnails.read();
		const signedUrls = this.#signedUrls.read();
		this.clear();
		this.#learner = learner;
		if (!learner) return;
		this.#thumbnails.restore(thumbnails, learner, now);
		this.#signedUrls.restore(signedUrls, learner, now);
	}

	signedUrl(path: string, now: number = Date.now()): SignedImageUrl | undefined {
		const signed = this.#signedUrls.get(path, now);
		return signed ? { url: signed.url, signedAt: signed.at } : undefined;
	}

	rememberSignedUrls(urls: Map<string, string>, signedAt: number): void {
		if (urls.size === 0) return;
		this.#signedUrls.remember(urls, signedAt);
		this.#signedUrls.store(this.#learner ?? undefined, signedAt);
	}

	clear(): void {
		this.#thumbnails.clear();
		this.#signedUrls.clear();
	}
}

export const resolvedImages = new ResolvedImages();
