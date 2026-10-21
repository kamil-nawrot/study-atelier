const TAB_KEY = 'study-atelier:card-index-tab';

export const CARD_INDEX_TABS = ['timeline', 'material', 'author', 'location', 'own'] as const;

export type CardIndexTab = (typeof CARD_INDEX_TABS)[number];

export function isCardIndexTab(value: unknown): value is CardIndexTab {
	return (CARD_INDEX_TABS as readonly unknown[]).includes(value);
}

export function rememberCardIndexTab(tab: string): void {
	try {
		sessionStorage.setItem(TAB_KEY, tab);
	} catch {
		return;
	}
}

export function rememberedCardIndexTab(): CardIndexTab {
	try {
		const stored = sessionStorage.getItem(TAB_KEY);
		return isCardIndexTab(stored) ? stored : 'timeline';
	} catch {
		return 'timeline';
	}
}
