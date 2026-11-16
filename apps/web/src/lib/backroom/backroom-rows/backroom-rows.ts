import { resolve } from '$app/paths';
import type { BackroomRow } from '#lib/backroom/types/backroom-row.ts';
import type { BackroomTerm } from '#lib/backroom/types/backroom-term.ts';
import type { FixField } from '#lib/backroom/types/fix-field.ts';
import type { FlagReason } from '#lib/backroom/types/flag-reason.ts';
import type { FlagRecord } from '#lib/backroom/types/flag-record.ts';
import { formatRecordNumber } from '#lib/catalogue/record-number/record-number.ts';
import type { WallArtwork } from '#lib/catalogue/types/wall-artwork.ts';
import { m } from '#lib/i18n/i18n.ts';

type Missing = keyof typeof m.backroom.missing;

const ARTWORK_FIELDS: Record<FlagReason, FixField> = {
	image: 'image',
	pin: 'image',
	data: 'data',
	note: 'note',
	answers: 'data',
	hidden: 'top',
	definition: 'top',
	meaning: 'top',
	other: 'top'
};

const TERM_FIELDS: Partial<Record<FlagReason, FixField>> = {
	hidden: 'forms',
	definition: 'definition',
	answers: 'definition'
};

const MISSING_FIELDS: Record<Missing, FixField> = {
	style: 'style',
	year: 'year',
	image: 'image',
	definition: 'definition'
};

function artworkPath(artwork: WallArtwork): string {
	return resolve('/(app)/atelier/[number]/edit', { number: String(artwork.number) });
}

function termPath(id: string): string {
	return resolve('/(app)/atelier/glossary/[id]/edit', { id });
}

function symbolPath(id: string, reason: FlagReason): string {
	return reason === 'other'
		? resolve('/(app)/atelier/glossary/symbols/[id]/edit', { id })
		: resolve('/(app)/atelier/glossary/symbols/[id]', { id });
}

function originOf(flag: FlagRecord, kind: BackroomRow['kind']): string {
	const question = flag.question;
	if (!question) return m.backroom.origins[kind];
	if (question.mode === 'note_gap' && question.note !== undefined) {
		return m.backroom.origins.note(formatRecordNumber(question.note));
	}
	return m.backroom.origins.question(question.text);
}

function reasonOf(flag: FlagRecord): string {
	const reason = m.backroom.reasons[flag.reason];
	return flag.imageNumber && (flag.reason === 'image' || flag.reason === 'pin')
		? `${reason} (${m.backroom.imageNumber(flag.imageNumber)})`
		: reason;
}

function target(
	flag: FlagRecord,
	artworks: ReadonlyMap<string, WallArtwork>,
	terms: ReadonlyMap<string, BackroomTerm>
):
	| (Pick<BackroomRow, 'kind' | 'title' | 'artwork'> & { path: string; field: FixField })
	| undefined {
	if (flag.artworkId) {
		const artwork = artworks.get(flag.artworkId);
		if (!artwork) return undefined;
		const field = ARTWORK_FIELDS[flag.reason];
		return { kind: 'artwork', title: artwork.title, artwork, path: artworkPath(artwork), field };
	}
	if (flag.termId) {
		const term = terms.get(flag.termId);
		if (!term) return undefined;
		const field = TERM_FIELDS[flag.reason] ?? 'top';
		return { kind: 'term', title: term.name, path: termPath(term.id), field };
	}
	if (!flag.symbolId || !flag.symbolName) return undefined;
	const field = flag.reason === 'other' ? 'top' : 'meanings';
	return {
		kind: 'symbol',
		title: flag.symbolName,
		path: symbolPath(flag.symbolId, flag.reason),
		field
	};
}

export function flagRows(
	flags: readonly FlagRecord[],
	artworks: readonly WallArtwork[],
	terms: readonly BackroomTerm[]
): BackroomRow[] {
	const byArtwork = new Map(artworks.map((artwork) => [artwork.id, artwork]));
	const byTerm = new Map(terms.map((term) => [term.id, term]));
	return flags.flatMap((flag): BackroomRow[] => {
		const found = target(flag, byArtwork, byTerm);
		if (!found) return [];
		const { path, field, ...item } = found;
		const reason = reasonOf(flag);
		return [
			{
				...item,
				reason,
				origin: originOf(flag, item.kind),
				...(flag.comment ? { comment: flag.comment } : {}),
				entry: {
					key: `flag:${flag.id}`,
					path,
					field,
					note: m.backroom.note(reason, flag.comment ?? undefined),
					flagId: flag.id
				}
			}
		];
	});
}

function missingOfArtwork(artwork: WallArtwork): Missing[] {
	return [
		...(artwork.styles.length === 0 ? (['style'] as const) : []),
		...(artwork.yearTo === null ? (['year'] as const) : []),
		...(artwork.hasImage ? [] : (['image'] as const))
	];
}

function missingRow(
	key: string,
	item: Pick<BackroomRow, 'kind' | 'title' | 'artwork'>,
	path: string,
	missing: readonly Missing[]
): BackroomRow {
	const reason = missing.map((kind) => m.backroom.missing[kind]).join(' · ');
	return {
		...item,
		reason,
		entry: { key, path, field: MISSING_FIELDS[missing[0]], note: reason }
	};
}

export function missingRows(
	artworks: readonly WallArtwork[],
	terms: readonly BackroomTerm[]
): BackroomRow[] {
	const ofArtworks = [...artworks]
		.sort((first, second) => first.number - second.number)
		.flatMap((artwork) => {
			const missing = missingOfArtwork(artwork);
			if (missing.length === 0) return [];
			const item = { kind: 'artwork' as const, title: artwork.title, artwork };
			return [missingRow(`missing:${artwork.id}`, item, artworkPath(artwork), missing)];
		});
	const ofTerms = terms
		.filter((term) => !term.hasDefinition)
		.map((term) =>
			missingRow(`missing:${term.id}`, { kind: 'term', title: term.name }, termPath(term.id), [
				'definition'
			])
		);
	return [...ofArtworks, ...ofTerms];
}
