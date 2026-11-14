import { failureMessage } from '#lib/auth/expired-session-data/expired-session-data.ts';
import { removeOwnImage } from '#lib/images/own-image-data/own-image-data.ts';
import { cacheKeys, forgetCached, type CacheKey } from '#lib/shared/data/data-cache/data-cache.ts';
import { supabase } from '#lib/shared/data/supabase/supabase.ts';
import { emptyAuthorDetails } from '#lib/values/author-form/author-form.ts';
import { authorRelationPayload } from '#lib/author-relations/author-relation-types/author-relation-types.ts';
import { loadAuthorRelations } from '#lib/author-relations/author-relations-data/author-relations-data.ts';
import type { AuthorRelation } from '#lib/author-relations/types/author-relation.ts';
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
import type { PlaceCity } from '#lib/values/types/place-city.ts';
import type { PlacePoint } from '#lib/map/types/place-point.ts';
import type { ValueDetails } from '#lib/values/types/value-details.ts';
import type { ValueSubject } from '#lib/card-index/types/value-subject.ts';
import type { CategoryCode } from '#lib/catalogue/types/category-code.ts';
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
	country: string | null;
};

type LocationRow = {
	country_code: string | null;
	place_type: string | null;
	latitude: number | null;
	longitude: number | null;
	city_id: string | null;
};

type CityRow = {
	name: string;
	location_details: Pick<LocationRow, 'country_code' | 'latitude' | 'longitude'> | null;
};

type DetailsRow = { summary: string | null; notes: string | null } & Partial<AuthorRow> &
	Partial<LocationRow>;

const LOCATION_COLUMNS = 'summary, notes, country_code, place_type, latitude, longitude, city_id';

const CITY_COLUMNS =
	'name, location_details!location_details_value_id_owner_id_category_code_fkey(country_code, latitude, longitude)';

const AUTHOR_COLUMNS = [
	'summary',
	'notes',
	'birth_year',
	'death_year',
	'years_approximate',
	'sort_name',
	'country',
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

async function authorOf(
	row: DetailsRow | null,
	relations: AuthorRelation[]
): Promise<AuthorDetails> {
	if (!row) return { ...emptyAuthorDetails(), relations };
	return {
		image: await withPreview(imageOf(row as AuthorRow)),
		birthYear: row.birth_year ?? null,
		deathYear: row.death_year ?? null,
		yearsApproximate: row.years_approximate ?? false,
		sortName: row.sort_name ?? null,
		country: row.country ?? null,
		relations
	};
}

function pointOf(row: Partial<LocationRow> | null | undefined): PlacePoint | null {
	return row?.latitude != null && row.longitude != null
		? { latitude: row.latitude, longitude: row.longitude }
		: null;
}

async function cityOf(
	cityId: string | null | undefined
): Promise<{ city: PlaceCity | null; error?: ErrorLike }> {
	if (!cityId) return { city: null };
	const { data, error } = await supabase
		.from('category_values')
		.select(CITY_COLUMNS)
		.eq('id', cityId)
		.maybeSingle();
	if (error) return { city: null, error };
	const row = data as CityRow | null;
	if (!row) return { city: null, error: {} };
	const details = row.location_details;
	return {
		city: {
			id: cityId,
			name: row.name,
			countryCode: isCountryCode(details?.country_code) ? details.country_code : null,
			point: pointOf(details)
		}
	};
}

async function locationOf(
	row: DetailsRow | null
): Promise<{ location: LocationDetails; error?: ErrorLike }> {
	const placeType = row?.place_type;
	const { city, error } = await cityOf(row?.city_id);
	return {
		location: {
			countryCode: isCountryCode(row?.country_code) ? row.country_code : null,
			placeType: isPlaceType(placeType) ? placeType : null,
			point: pointOf(row),
			...(city ? { city } : {})
		},
		error
	};
}

export async function loadValueDetails(subject: ValueSubject): Promise<ValueDetailsResult> {
	const [{ data, error }, related] = await Promise.all([
		detailsQuery(subject),
		subject.kind === 'author' ? loadAuthorRelations(subject.record.id) : undefined
	]);
	if (error) return { details: emptyValueDetails(), error: collectionErrorMessage(error) };
	if (related?.error) return { details: emptyValueDetails(), error: related.error };
	const details: ValueDetails = { summary: data?.summary ?? '', notes: data?.notes ?? '' };
	if (subject.kind === 'author') details.author = await authorOf(data, related?.relations ?? []);
	if (subject.kind === 'location') {
		const located = await locationOf(data);
		if (located.error) {
			return { details: emptyValueDetails(), error: collectionErrorMessage(located.error) };
		}
		details.location = located.location;
	}
	return { details };
}

function authorColumns(author: AuthorDetails, image: ReturnType<typeof imageColumns>): object {
	return {
		birth_year: author.birthYear,
		death_year: author.deathYear,
		years_approximate: author.yearsApproximate,
		sort_name: author.sortName,
		country: author.country,
		relations: authorRelationPayload(author.relations),
		...image
	};
}

function cityIdOf(location: LocationDetails | undefined): string | null {
	return location?.placeType === 'city' ? null : (location?.city?.id ?? null);
}

function locationColumns(location: LocationDetails, previous: LocationDetails | undefined): object {
	const columns: Record<string, string | null> = {};
	if (location.countryCode !== (previous?.countryCode ?? null)) {
		columns.country_code = location.countryCode;
	}
	if (location.placeType !== (previous?.placeType ?? null)) columns.place_type = location.placeType;
	if (cityIdOf(location) !== cityIdOf(previous)) columns.city_id = cityIdOf(location);
	return columns;
}

function detailsPayload(
	text: { summary: string; notes: string },
	details: ValueDetails,
	image: StoredImage | null,
	previous: ValueDetails | undefined
): Json {
	const { author, location } = details;
	return {
		...text,
		...(author ? authorColumns(author, imageColumns(image)) : {}),
		...(location ? locationColumns(location, previous?.location) : {})
	} as Json;
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

const DETAILS_KEYS: Partial<Record<CategoryCode, readonly CacheKey[]>> = {
	author: [cacheKeys.atelier, cacheKeys.cardIndex],
	location: [cacheKeys.cardIndex]
};

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
		forgetCached([cacheKeys.eraSummaries]);
		return error ? { error: await failureMessage(error, cardIndexErrorMessage) } : {};
	}

	const author = details.author;
	const stored = author ? await storedImage(author.image) : { image: null };
	if (stored.error !== undefined) return { error: stored.error };
	const newUpload = author?.image?.kind === 'file' ? uploadPath(stored.image) : null;

	const { error } = await supabase.rpc('save_value_details', {
		target_value: subject.record.id,
		details: detailsPayload(text, details, stored.image, previous)
	});
	forgetCached(DETAILS_KEYS[subject.kind] ?? []);
	if (error) {
		if (newUpload) await removeOwnImage(newUpload);
		return { error: await failureMessage(error, cardIndexErrorMessage) };
	}

	await removeReplacedUpload(details, previous, stored.image);
	return {};
}

export async function ensureCityPlace(
	city: PlaceCity,
	exclude?: string
): Promise<{ id: string; error?: undefined } | { id?: undefined; error: string }> {
	if (city.id) return { id: city.id };
	const { data, error } = await supabase.rpc('ensure_city_place', {
		city_name: city.name,
		wikidata_id: city.wikidataId ?? undefined,
		country_code: city.countryCode ?? undefined,
		latitude: city.point?.latitude,
		longitude: city.point?.longitude,
		exclude: exclude || undefined
	});
	forgetCached([cacheKeys.cardIndex]);
	if (error || !data) {
		return { error: await failureMessage(error ?? {}, cardIndexErrorMessage) };
	}
	return { id: data };
}
