import { resolve } from '$app/paths';
import type { BackroomRow } from '#lib/backroom/types/backroom-row.ts';
import type { BackroomTerm } from '#lib/backroom/types/backroom-term.ts';
import type { BrokenImage } from '#lib/backroom/types/broken-image.ts';
import type { FixField } from '#lib/backroom/types/fix-field.ts';
import type { FlagReason } from '#lib/backroom/types/flag-reason.ts';
import { fieldOf, reasonText } from '#lib/backroom/flag-fields/flag-fields.ts';
import type { FlagRecord } from '#lib/backroom/types/flag-record.ts';
import type { FlagTarget } from '#lib/backroom/types/flag-target.ts';
import { formatRecordNumber } from '#lib/catalogue/record-number/record-number.ts';
import type { WallArtwork } from '#lib/catalogue/types/wall-artwork.ts';
import { m } from '#lib/i18n/i18n.ts';

type Missing = keyof typeof m.backroom.missing;

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

function originOf(flag: FlagRecord, kind: BackroomRow['kind']): string | undefined {
	const question = flag.question;
	if (!question) return kind === 'event' ? undefined : m.backroom.origins[kind];
	if (question.mode === 'note_gap' && question.note !== undefined) {
		return m.backroom.origins.note(formatRecordNumber(question.note));
	}
	return m.backroom.origins.question(question.text);
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
		const field = fieldOf('artwork', flag.reason);
		return { kind: 'artwork', title: artwork.title, artwork, path: artworkPath(artwork), field };
	}
	if (flag.termId) {
		const term = terms.get(flag.termId);
		if (!term) return undefined;
		const field = fieldOf('term', flag.reason);
		return { kind: 'term', title: term.name, path: termPath(term.id), field };
	}
	if (flag.eventId) {
		if (!flag.eventName) return undefined;
		return {
			kind: 'event',
			title: flag.eventName,
			path: resolve('/(app)/atelier/timeline/events/[id]/edit', { id: flag.eventId }),
			field: fieldOf('event', flag.reason)
		};
	}
	if (!flag.symbolId || !flag.symbolName) return undefined;
	const field = fieldOf('symbol', flag.reason);
	return {
		kind: 'symbol',
		title: flag.symbolName,
		path: symbolPath(flag.symbolId, flag.reason),
		field
	};
}

function flagTarget(flag: FlagRecord): FlagTarget | undefined {
	if (flag.artworkId) return { artworkId: flag.artworkId };
	if (flag.termId) return { termId: flag.termId };
	if (flag.eventId) return { eventId: flag.eventId };
	return flag.symbolId ? { symbolId: flag.symbolId } : undefined;
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
		const reason = reasonText(flag.reason, flag.imageNumber);
		const origin = originOf(flag, item.kind);
		return [
			{
				...item,
				reason,
				...(origin ? { origin } : {}),
				...(flag.comment ? { comment: flag.comment } : {}),
				...(flag.holds ? { held: true } : {}),
				flag,
				entry: {
					key: `flag:${flag.id}`,
					path,
					field,
					note: m.backroom.note(reason, flag.comment ?? undefined),
					flagIds: [flag.id],
					target: flagTarget(flag)
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
	item: Pick<BackroomRow, 'kind' | 'title' | 'artwork' | 'imageBroken'>,
	path: string,
	missing: readonly Missing[],
	broken: readonly number[] = []
): BackroomRow {
	const reason = [
		...broken.map((position) => m.backroom.brokenImage(position === 0 ? undefined : position + 1)),
		...missing.map((kind) => m.backroom.missing[kind])
	].join(' · ');
	const field = broken.length > 0 ? 'image' : MISSING_FIELDS[missing[0]];
	return { ...item, reason, entry: { key, path, field, note: reason } };
}

function brokenByArtwork(images: readonly BrokenImage[]): Map<string, number[]> {
	const byArtwork = new Map<string, number[]>();
	for (const { artworkId, position } of images) {
		byArtwork.set(artworkId, [...(byArtwork.get(artworkId) ?? []), position]);
	}
	return byArtwork;
}

export function missingRows(
	artworks: readonly WallArtwork[],
	terms: readonly BackroomTerm[],
	brokenImages: readonly BrokenImage[] = []
): BackroomRow[] {
	const broken = brokenByArtwork(brokenImages);
	const ofArtworks = [...artworks]
		.sort((first, second) => first.number - second.number)
		.flatMap((artwork) => {
			const missing = missingOfArtwork(artwork);
			const positions = [...(broken.get(artwork.id) ?? [])].sort((a, b) => a - b);
			if (missing.length === 0 && positions.length === 0) return [];
			const item = {
				kind: 'artwork' as const,
				title: artwork.title,
				artwork,
				...(positions[0] === 0 ? { imageBroken: true as const } : {})
			};
			const key = `missing:${artwork.id}`;
			return [missingRow(key, item, artworkPath(artwork), missing, positions)];
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
