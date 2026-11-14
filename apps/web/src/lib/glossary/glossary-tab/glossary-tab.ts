import { readStored, writeStored } from '#lib/shared/utils/storage/storage.ts';

const TAB_KEY = 'study-atelier:glossary-tab';

export const GLOSSARY_TABS = ['terms', 'symbols'] as const;

export type GlossaryTab = (typeof GLOSSARY_TABS)[number];

export function isGlossaryTab(value: unknown): value is GlossaryTab {
	return (GLOSSARY_TABS as readonly unknown[]).includes(value);
}

export function rememberGlossaryTab(tab: string): void {
	writeStored('session', TAB_KEY, tab);
}

export function rememberedGlossaryTab(requested?: string | null): GlossaryTab {
	if (isGlossaryTab(requested)) return requested;
	const stored = readStored('session', TAB_KEY);
	return isGlossaryTab(stored) ? stored : 'terms';
}
