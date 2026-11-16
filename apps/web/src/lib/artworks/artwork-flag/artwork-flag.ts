import type { FlagChoicePin } from '#lib/backroom/types/flag-choice-pin.ts';
import type { FlagGroup } from '#lib/backroom/types/flag-group.ts';
import type { FlagReason } from '#lib/backroom/types/flag-reason.ts';
import type { ArtworkRecord } from '#lib/artworks/types/artwork-record.ts';
import type { GlossaryTerm } from '#lib/glossary/types/glossary-term.ts';
import { pinsOfImage } from '#lib/pins/pin-layout/pin-layout.ts';
import type { Pin } from '#lib/pins/types/pin.ts';
import type { SymbolOption } from '#lib/symbols/types/symbol-option.ts';

type Names = { glossary?: readonly GlossaryTerm[]; symbols?: readonly SymbolOption[] };

export function stagePins(
	pins: readonly Pin[],
	imageId: string | undefined,
	names: Names
): FlagChoicePin[] {
	const terms = new Map((names.glossary ?? []).map((term) => [term.id, term.name]));
	const symbols = new Map((names.symbols ?? []).map((symbol) => [symbol.id, symbol.name]));
	return pinsOfImage(pins, imageId).map((pin, index) => {
		const name =
			(pin.glossaryEntryId ? terms.get(pin.glossaryEntryId) : undefined) ??
			(pin.symbolId ? symbols.get(pin.symbolId) : undefined);
		return { id: pin.id, imageId: pin.imageId, number: index + 1, ...(name ? { name } : {}) };
	});
}

export function artworkFlagGroup(
	artwork: ArtworkRecord,
	imageId: string | undefined,
	pinCount: number
): FlagGroup {
	const reasons: FlagReason[] = [
		...(artwork.image ? (['image'] as const) : []),
		...(pinCount > 0 ? (['pin'] as const) : []),
		'data',
		'note',
		'other'
	];
	return {
		item: {
			kind: 'artwork',
			id: artwork.id,
			title: artwork.title,
			...(imageId ? { imageId } : {})
		},
		reasons
	};
}
