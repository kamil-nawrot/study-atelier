import { m } from '#lib/i18n/i18n.ts';

export const SHARE_SLOT = '<!--share-->';
export const SHARE_IMAGE = '/og-image.png';

function attribute(text: string): string {
	return text.replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;');
}

export function shareTags(origin: string): string {
	const tags: [string, string, string][] = [
		['name', 'description', m.landing.metaDescription],
		['property', 'og:type', 'website'],
		['property', 'og:site_name', m.app.name],
		['property', 'og:title', m.landing.pageTitle],
		['property', 'og:description', m.landing.metaDescription],
		['property', 'og:image', `${origin}${SHARE_IMAGE}`],
		['property', 'og:image:width', '1200'],
		['property', 'og:image:height', '630'],
		['name', 'twitter:card', 'summary_large_image']
	];
	return tags
		.map(([key, name, content]) => `<meta ${key}="${name}" content="${attribute(content)}" />`)
		.join('');
}
