import { describe, expect, it } from 'vitest';
import { m } from '#lib/i18n/i18n.ts';
import { shareTags } from './share.ts';

describe('shareTags', () => {
	it('describes the app for a shared link with an image on the same host', () => {
		const tags = shareTags('https://studyatelier.art');

		expect(tags).toContain(`<meta property="og:title" content="${m.landing.pageTitle}" />`);
		expect(tags).toContain(`<meta name="description" content="${m.landing.metaDescription}" />`);
		expect(tags).toContain(
			'<meta property="og:image" content="https://studyatelier.art/og-image.png" />'
		);
		expect(tags).toContain('<meta name="twitter:card" content="summary_large_image" />');
	});

	it('takes the host of the environment that serves the page', () => {
		expect(shareTags('https://develop.study-atelier.pages.dev')).toContain(
			'content="https://develop.study-atelier.pages.dev/og-image.png"'
		);
	});
});
