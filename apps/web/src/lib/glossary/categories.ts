import type { LucideIcon } from '@lucide/svelte';
import DraftingCompass from '@lucide/svelte/icons/drafting-compass';
import Cuboid from '@lucide/svelte/icons/cuboid';
import Lightbulb from '@lucide/svelte/icons/lightbulb';
import Paintbrush from '@lucide/svelte/icons/paintbrush';
import PersonStanding from '@lucide/svelte/icons/person-standing';
import Pipette from '@lucide/svelte/icons/pipette';
import type { ChoiceTile } from '@study-atelier/ui';
import { m } from '#lib/i18n/index.ts';
import type { GlossaryCategory } from './types.ts';

export const GLOSSARY_CATEGORIES: readonly GlossaryCategory[] = [
	'person',
	'architecture',
	'painting',
	'sculpture',
	'technique',
	'general'
];

const GLOSSARY_CATEGORY_ICONS: Record<GlossaryCategory, LucideIcon> = {
	person: PersonStanding,
	architecture: DraftingCompass,
	painting: Paintbrush,
	sculpture: Cuboid,
	technique: Pipette,
	general: Lightbulb
};

export function isGlossaryCategory(value: unknown): value is GlossaryCategory {
	return GLOSSARY_CATEGORIES.includes(value as GlossaryCategory);
}

export function glossaryCategoryIcon(category: GlossaryCategory): LucideIcon {
	return GLOSSARY_CATEGORY_ICONS[category];
}

export function glossaryCategoryName(category: GlossaryCategory): string {
	return m.glossary.categoryNames[category];
}

export function glossaryCategoryTiles(): ChoiceTile[] {
	return GLOSSARY_CATEGORIES.map((category) => ({
		value: category,
		label: glossaryCategoryName(category),
		icon: GLOSSARY_CATEGORY_ICONS[category]
	}));
}
