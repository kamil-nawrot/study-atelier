import { SIGNED_URL_SECONDS } from '#lib/images/bucket/bucket.ts';

type SignedImageUrl = {
	url: string;
	signedAt: number;
};

export class ResolvedImages {
	#thumbnails = new Map<string, string>();
	#signedUrls = new Map<string, SignedImageUrl>();

	thumbnail(file: string): string | undefined {
		return this.#thumbnails.get(file);
	}

	rememberThumbnails(thumbnails: Map<string, string>): void {
		for (const [file, url] of thumbnails) this.#thumbnails.set(file, url);
	}

	signedUrl(path: string, now: number = Date.now()): SignedImageUrl | undefined {
		const signed = this.#signedUrls.get(path);
		if (!signed || now - signed.signedAt >= SIGNED_URL_SECONDS * 1000) return undefined;
		return signed;
	}

	rememberSignedUrls(urls: Map<string, string>, signedAt: number): void {
		for (const [path, url] of urls) this.#signedUrls.set(path, { url, signedAt });
	}

	clear(): void {
		this.#thumbnails.clear();
		this.#signedUrls.clear();
	}
}

export const resolvedImages = new ResolvedImages();
