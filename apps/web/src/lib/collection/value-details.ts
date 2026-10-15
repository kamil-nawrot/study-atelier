import { failureMessage } from '#lib/auth/expired-session.svelte.ts';
import { removeOwnImage } from '#lib/images/own-image.ts';
import { supabase } from '#lib/supabase.ts';
import { emptyAuthorDetails } from './author-form.ts';
import { cardIndexErrorMessage, collectionErrorMessage } from './errors.ts';
import {
	IMAGE_COLUMNS,
	imageColumns,
	imageOf,
	storedImage,
	uploadPath,
	withPreview,
	type ImageRow
} from './image-record.ts';
import { isCountryCode } from './countries.ts';
import { isPlaceType } from './place-types.ts';
import type {
	AuthorDetails,
	LocationDetails,
	ValueDetails,
	ValueDetailsResult,
	ValueSubject
} from './types.ts';

type ErrorLike = { code?: string; message?: string };

type AuthorRow = ImageRow & {
	birth_year: number | null;
	death_year: number | null;
	years_approximate: boolean;
	sort_name: string | null;
};

type LocationRow = { country_code: string | null; place_type: string | null };

type DetailsRow = { summary: string | null; notes: string | null } & Partial<AuthorRow> &
	Partial<LocationRow>;

const LOCATION_COLUMNS = 'summary, notes, country_code, place_type';

const AUTHOR_COLUMNS = [
	'summary',
	'notes',
	'birth_year',
	'death_year',
	'years_approximate',
	'sort_name',
	...IMAGE_COLUMNS
].join(', ');

type DetailsQuery = PromiseLike<{ data: DetailsRow | null; error: ErrorLike | null }>;

export type SaveDetailsResult = {
	error?: string;
};

export function emptyValueDetails(): ValueDetails {
	return { summary: '', notes: '' };
}

function detailsQuery(subject: ValueSubject): DetailsQuery {
	const columns = 'summary, notes';
	switch (subject.kind) {
		case 'era':
			return supabase
				.from('era_details')
				.select(columns)
				.eq('era_code', subject.code)
				.maybeSingle();
		case 'period':
			return supabase
				.from('period_details')
				.select(columns)
				.eq('value_id', subject.record.id)
				.maybeSingle();
		case 'style':
			return supabase
				.from('style_details')
				.select(columns)
				.eq('value_id', subject.record.id)
				.maybeSingle();
		case 'material':
			return supabase
				.from('material_details')
				.select(columns)
				.eq('value_id', subject.record.id)
				.maybeSingle();
		case 'author':
			return supabase
				.from('author_details')
				.select(AUTHOR_COLUMNS)
				.eq('value_id', subject.record.id)
				.maybeSingle();
		case 'location':
			return supabase
				.from('location_details')
				.select(LOCATION_COLUMNS)
				.eq('value_id', subject.record.id)
				.maybeSingle();
	}
}

async function authorOf(row: DetailsRow | null): Promise<AuthorDetails> {
	if (!row) return emptyAuthorDetails();
	return {
		image: await withPreview(imageOf(row as AuthorRow)),
		birthYear: row.birth_year ?? null,
		deathYear: row.death_year ?? null,
		yearsApproximate: row.years_approximate ?? false,
		sortName: row.sort_name ?? null
	};
}

function locationOf(row: DetailsRow | null): LocationDetails {
	const placeType = row?.place_type;
	return {
		countryCode: isCountryCode(row?.country_code) ? row.country_code : null,
		placeType: isPlaceType(placeType) ? placeType : null
	};
}

export async function loadValueDetails(subject: ValueSubject): Promise<ValueDetailsResult> {
	const { data, error } = await detailsQuery(subject);
	if (error) return { details: emptyValueDetails(), error: collectionErrorMessage(error) };
	const details: ValueDetails = { summary: data?.summary ?? '', notes: data?.notes ?? '' };
	if (subject.kind === 'author') details.author = await authorOf(data);
	if (subject.kind === 'location') details.location = locationOf(data);
	return { details };
}

export function valueDetailsChanged(a: ValueDetails, b: ValueDetails): boolean {
	return (
		a.summary.trim() !== b.summary.trim() ||
		a.notes !== b.notes ||
		JSON.stringify(a.author ?? null) !== JSON.stringify(b.author ?? null) ||
		JSON.stringify(a.location ?? null) !== JSON.stringify(b.location ?? null)
	);
}

function authorColumns(author: AuthorDetails, image: ReturnType<typeof imageColumns>): object {
	return {
		birth_year: author.birthYear,
		death_year: author.deathYear,
		years_approximate: author.yearsApproximate,
		sort_name: author.sortName,
		...image
	};
}

export async function saveValueDetails(
	subject: ValueSubject,
	details: ValueDetails,
	previous?: ValueDetails
): Promise<SaveDetailsResult> {
	const text = { summary: details.summary.trim(), notes: details.notes.trim() };
	if (subject.kind === 'era') {
		const { error } = await supabase.rpc('save_era_details', {
			target_era: subject.code,
			details: text
		});
		return error ? { error: await failureMessage(error, cardIndexErrorMessage) } : {};
	}

	const author = details.author;
	const stored = author ? await storedImage(author.image) : { image: null };
	if (stored.error !== undefined) return { error: stored.error };
	const newUpload = author?.image?.kind === 'file' ? uploadPath(stored.image) : null;
	const location = details.location;
	const payload = {
		...text,
		...(author ? authorColumns(author, imageColumns(stored.image)) : {}),
		...(location ? { country_code: location.countryCode, place_type: location.placeType } : {})
	};

	const { error } = await supabase.rpc('save_value_details', {
		target_value: subject.record.id,
		details: payload
	});
	if (error) {
		if (newUpload) await removeOwnImage(newUpload);
		return { error: await failureMessage(error, cardIndexErrorMessage) };
	}

	const previousUpload = uploadPath(previous?.author?.image ?? null);
	if (author && previousUpload && previousUpload !== uploadPath(stored.image)) {
		await removeOwnImage(previousUpload);
	}
	return {};
}
