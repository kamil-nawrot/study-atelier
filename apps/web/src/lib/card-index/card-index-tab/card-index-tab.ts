import { readStored, writeStored } from '#lib/shared/utils/storage/storage.ts';

const TAB_KEY = 'study-atelier:card-index-tab';

export const CARD_INDEX_TABS = ['timeline', 'material', 'author', 'location', 'own'] as const;

type CardIndexTab = (typeof CARD_INDEX_TABS)[number];

export function isCardIndexTab(value: unknown): value is CardIndexTab {
	return (CARD_INDEX_TABS as readonly unknown[]).includes(value);
}

export function rememberCardIndexTab(tab: string): void {
	writeStored('session', TAB_KEY, tab);
}

export function rememberedCardIndexTab(): CardIndexTab {
	const stored = readStored('session', TAB_KEY);
	return isCardIndexTab(stored) ? stored : 'timeline';
}
