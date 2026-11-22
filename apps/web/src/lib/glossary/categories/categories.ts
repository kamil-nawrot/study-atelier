import type { LucideIcon } from '@lucide/svelte';
import BookOpen from '@lucide/svelte/icons/book-open';
import CircleDashed from '@lucide/svelte/icons/circle-dashed';
import Crown from '@lucide/svelte/icons/crown';
import Cross from '@lucide/svelte/icons/cross';
import Cuboid from '@lucide/svelte/icons/cuboid';
import DraftingCompass from '@lucide/svelte/icons/drafting-compass';
import Feather from '@lucide/svelte/icons/feather';
import GraduationCap from '@lucide/svelte/icons/graduation-cap';
import HandCoins from '@lucide/svelte/icons/hand-coins';
import Lightbulb from '@lucide/svelte/icons/lightbulb';
import Paintbrush from '@lucide/svelte/icons/paintbrush';
import Pipette from '@lucide/svelte/icons/pipette';
import ScanEye from '@lucide/svelte/icons/scan-eye';
import SunMedium from '@lucide/svelte/icons/sun-medium';
import UserRound from '@lucide/svelte/icons/user-round';
import type { ChoiceTile } from '@study-atelier/ui';
import { m } from '#lib/i18n/i18n.ts';
import type { FigureCategory } from '#lib/glossary/types/figure-category.ts';
import type { GlossaryCategory } from '#lib/glossary/types/glossary-category.ts';
import type { TermCategory } from '#lib/glossary/types/term-category.ts';
import type { GlossaryKind } from '#lib/glossary/types/glossary-kind.ts';

export const TERM_CATEGORIES: readonly TermCategory[] = [
	'architecture',
	'painting',
	'sculpture',
	'technique',
	'iconography',
	'general'
];

export const FIGURE_CATEGORIES: readonly FigureCategory[] = [
	'ruler',
	'patron',
	'artist',
	'scholar',
	'sacred',
	'myth'
];

export const GLOSSARY_CATEGORIES: readonly GlossaryCategory[] = [
	...TERM_CATEGORIES,
	...FIGURE_CATEGORIES
];

const GLOSSARY_CATEGORY_ICONS: Record<GlossaryCategory, LucideIcon> = {
	architecture: DraftingCompass,
	painting: Paintbrush,
	sculpture: Cuboid,
	technique: Pipette,
	iconography: ScanEye,
	general: Lightbulb,
	ruler: Crown,
	patron: HandCoins,
	artist: Feather,
	scholar: GraduationCap,
	sacred: Cross,
	myth: SunMedium
};

export function isGlossaryCategory(value: unknown): value is GlossaryCategory {
	return GLOSSARY_CATEGORIES.includes(value as GlossaryCategory);
}

export function isFigure(category: unknown): category is FigureCategory {
	return FIGURE_CATEGORIES.includes(category as FigureCategory);
}

export function fitsKind(category: GlossaryCategory, kind: GlossaryKind): boolean {
	return categoriesOf(kind).includes(category);
}

export function isGlossaryKind(value: unknown): value is GlossaryKind {
	return value === 'term' || value === 'figure';
}

export function categoriesOf(kind: GlossaryKind): readonly GlossaryCategory[] {
	return kind === 'figure' ? FIGURE_CATEGORIES : TERM_CATEGORIES;
}

export function glossaryCategoryIcon(category: GlossaryCategory): LucideIcon {
	return GLOSSARY_CATEGORY_ICONS[category];
}

export function glossaryCategoryName(category: GlossaryCategory): string {
	return m.glossary.categoryNames[category];
}

export const NO_CATEGORY_ICON: LucideIcon = CircleDashed;

const KIND_ICONS: Record<GlossaryKind, LucideIcon> = {
	term: BookOpen,
	figure: UserRound
};

export function glossaryEntryIcon(entry: {
	kind: GlossaryKind;
	category: GlossaryCategory | null;
}): LucideIcon {
	return entry.category ? GLOSSARY_CATEGORY_ICONS[entry.category] : KIND_ICONS[entry.kind];
}

export function glossaryEntryLabel(entry: {
	kind: GlossaryKind;
	category: GlossaryCategory | null;
}): string {
	return entry.category ? glossaryCategoryName(entry.category) : m.glossary.kindNames[entry.kind];
}

export function glossaryCategoryTiles(kind: GlossaryKind): ChoiceTile[] {
	return categoriesOf(kind).map((category) => ({
		value: category,
		label: glossaryCategoryName(category),
		icon: GLOSSARY_CATEGORY_ICONS[category]
	}));
}
