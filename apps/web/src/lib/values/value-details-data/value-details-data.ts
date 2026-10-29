import { failureMessage } from '#lib/auth/expired-session-data/expired-session-data.ts';
import { removeOwnImage } from '#lib/images/own-image-data/own-image-data.ts';
import { forgetCached } from '#lib/shared/data/data-cache/data-cache.ts';
import { supabase } from '#lib/shared/data/supabase/supabase.ts';
import { emptyAuthorDetails } from '#lib/values/author-form/author-form.ts';
import { cardIndexErrorMessage, collectionErrorMessage } from '#lib/catalogue/errors/errors.ts';
import {
	IMAGE_COLUMNS,
	imageColumns,
	imageOf,
	storedImage,
	uploadPath,
	withPreview
} from '#lib/images/image-record/image-record.ts';
import type { ImageRow } from '#lib/images/types/image-row.ts';
import type { StoredImage } from '#lib/images/types/stored-image.ts';
import type { Json } from '#lib/shared/data/database.types.ts';
import { isCountryCode } from '#lib/catalogue/countries/countries.ts';
import { isPlaceType } from '#lib/catalogue/place-types/place-types.ts';
import type { AuthorDetails } from '#lib/values/types/author-details.ts';
import type { LocationDetails } from '#lib/values/types/location-details.ts';
import type { ValueDetails } from '#lib/values/types/value-details.ts';
import type { ValueSubject } from '#lib/card-index/types/value-subject.ts';
import { emptyValueDetails } from '#lib/values/value-details/value-details.ts';

type ValueDetailsResult = {
	details: ValueDetails;
	error?: string;
};

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

type SaveDetailsResult = {
	error?: string;
};

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

function authorColumns(author: AuthorDetails, image: ReturnType<typeof imageColumns>): object {
	return {
		birth_year: author.birthYear,
		death_year: author.deathYear,
		years_approximate: author.yearsApproximate,
		sort_name: author.sortName,
		...image
	};
}

function detailsPayload(
	text: { summary: string; notes: string },
	details: ValueDetails,
	image: StoredImage | null
): Json {
	const { author, location } = details;
	return {
		...text,
		...(author ? authorColumns(author, imageColumns(image)) : {}),
		...(location ? { country_code: location.countryCode, place_type: location.placeType } : {})
	};
}

async function removeReplacedUpload(
	details: ValueDetails,
	previous: ValueDetails | undefined,
	image: StoredImage | null
): Promise<void> {
	const previousUpload = uploadPath(previous?.author?.image ?? null);
	if (details.author && previousUpload && previousUpload !== uploadPath(image)) {
		await removeOwnImage(previousUpload);
	}
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
		forgetCached();
		return error ? { error: await failureMessage(error, cardIndexErrorMessage) } : {};
	}

	const author = details.author;
	const stored = author ? await storedImage(author.image) : { image: null };
	if (stored.error !== undefined) return { error: stored.error };
	const newUpload = author?.image?.kind === 'file' ? uploadPath(stored.image) : null;

	const { error } = await supabase.rpc('save_value_details', {
		target_value: subject.record.id,
		details: detailsPayload(text, details, stored.image)
	});
	forgetCached();
	if (error) {
		if (newUpload) await removeOwnImage(newUpload);
		return { error: await failureMessage(error, cardIndexErrorMessage) };
	}

	await removeReplacedUpload(details, previous, stored.image);
	return {};
}
