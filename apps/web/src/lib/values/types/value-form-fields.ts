import type { EraCode } from '#lib/catalogue/types/era-code.ts';
import type { AuthorFormState } from '#lib/values/types/author-form-state.ts';
import type { LocationDetails } from '#lib/values/types/location-details.ts';
import type { ValueDetails } from '#lib/values/types/value-details.ts';

export type ValueFormFields = {
	name: string;
	eraCodes: EraCode[];
	periodIds: string[];
	details: ValueDetails;
	author: AuthorFormState | null;
	location: LocationDetails | null;
};
