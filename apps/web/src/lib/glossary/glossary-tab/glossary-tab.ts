import { resolve } from '$app/paths';
import type { ResolvedPathname } from '$app/types';
import { readStored, writeStored } from '#lib/shared/utils/storage/storage.ts';
import type { GlossaryKind } from '#lib/glossary/types/glossary-kind.ts';

const TAB_KEY = 'study-atelier:glossary-tab';

export const GLOSSARY_TABS = ['terms', 'figures', 'symbols'] as const;

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

export function glossaryTabOf(kind: GlossaryKind): GlossaryTab {
	return kind === 'figure' ? 'figures' : 'terms';
}

export function glossaryListPath(entry?: { kind: GlossaryKind }): ResolvedPathname {
	const path = resolve('/(app)/atelier/glossary');
	return (entry ? `${path}?tab=${glossaryTabOf(entry.kind)}` : path) as ResolvedPathname;
}
