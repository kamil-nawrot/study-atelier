import type { StoredFlag } from '#lib/backroom/types/stored-flag.ts';
import type { Holds } from '#lib/review/types/holds.ts';
import type { ReviewItem } from '#lib/review/types/review-item.ts';
import type { SessionStep } from '#lib/review/types/session-step.ts';

const KIND_REASONS = new Set(['pin', 'answers']);

export const NO_HOLDS: Holds = {
	artworks: new Set(),
	kinds: new Map(),
	terms: new Set(),
	symbols: new Set(),
	events: new Set()
};

export function holdsOf(flags: readonly StoredFlag[]): Holds {
	const artworks = new Set<string>();
	const kinds = new Map<string, Set<string>>();
	const terms = new Set<string>();
	const symbols = new Set<string>();
	const events = new Set<string>();
	for (const flag of flags) {
		if (!flag.holds) continue;
		if (flag.termId) terms.add(flag.termId);
		if (flag.symbolId) symbols.add(flag.symbolId);
		if (flag.eventId) events.add(flag.eventId);
		if (!flag.artworkId) continue;
		const kind = flag.reason === 'pin' ? 'quiz_pin' : flag.mode;
		if (!KIND_REASONS.has(flag.reason) || !kind) artworks.add(flag.artworkId);
		else kinds.set(flag.artworkId, new Set([...(kinds.get(flag.artworkId) ?? []), kind]));
	}
	return { artworks, kinds, terms, symbols, events };
}

function heldKind(holds: Holds, artworkId: string, kind: string): boolean {
	return holds.artworks.has(artworkId) || (holds.kinds.get(artworkId)?.has(kind) ?? false);
}

function artworkIdsOf(step: SessionStep): string[] {
	if (step.mode === 'order') return step.artworks.map((artwork) => artwork.id);
	if (step.mode === 'quiz_pair') {
		return step.quiz.options.flatMap((option) => (option.artwork ? [option.artwork.id] : []));
	}
	return 'artwork' in step ? [step.artwork.id] : [];
}

function heldItem(item: ReviewItem, holds: Holds): ReviewItem | undefined {
	if (!heldKind(holds, item.artwork.id, item.mode)) return item;
	if (holds.artworks.has(item.artwork.id)) return undefined;
	return { artwork: item.artwork, card: item.card, mode: 'flashcard' };
}

export function heldStep(step: SessionStep, holds: Holds): SessionStep | undefined {
	switch (step.mode) {
		case 'quiz_definition':
			return holds.terms.has(step.term.id) ? undefined : step;
		case 'quiz_symbol':
			return holds.symbols.has(step.symbol.id) ? undefined : step;
		case 'note_gap':
			return holds.terms.has(step.term.id) || holds.artworks.has(step.artwork.id)
				? undefined
				: step;
		case 'event_year':
			return holds.events.has(step.event.id) ? undefined : step;
		case 'quiz_pair':
		case 'quiz_relation':
		case 'year':
		case 'order':
			return artworkIdsOf(step).some((id) => heldKind(holds, id, step.mode)) ? undefined : step;
		default:
			return heldItem(step, holds);
	}
}

export function withoutHeld<T extends SessionStep>(steps: readonly T[], holds: Holds): T[] {
	return steps.flatMap((step) => {
		const kept = heldStep(step, holds);
		return kept ? [kept as T] : [];
	});
}
