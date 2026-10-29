import { m } from '#lib/i18n/i18n.ts';
import type { Curiosity } from '#lib/career/types/curiosity.ts';

const SOURCES: Readonly<Record<string, readonly string[]>> = {
	collection: [
		'https://www.britannica.com/topic/Ashmolean-Museum',
		'https://www.savevenice.org/project/jacopo-tintoretto-paradise'
	],
	grand_tour: [
		'https://www.benesse-artsite.jp/en/art/chichu.html',
		'https://www.lonelyplanet.com/brazil/the-southeast/belo-horizonte/attractions/instituto-de-arte-contemporanea-inhotim/a/poi-sig/1180580/363225'
	]
};

export function curiosityOf(exhibit: string, tier: number): Curiosity | undefined {
	const texts = (m.career.curiosities as Record<string, readonly string[]>)[exhibit] ?? [];
	const text = texts[tier - 1];
	const source = SOURCES[exhibit]?.[tier - 1];
	return text && source ? { text, source } : undefined;
}
