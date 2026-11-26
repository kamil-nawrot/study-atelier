import { m } from '#lib/i18n/i18n.ts';
import { eraJunctions } from '#lib/catalogue/era-bounds/era-bounds.svelte.ts';
import { validateAuthorForm } from '#lib/values/author-form/author-form.ts';
import { validateEraBounds } from '#lib/values/era-bounds-form/era-bounds-form.ts';
import type { planNameChange } from '#lib/card-index/card-index/card-index.ts';
import type { CardIndexRecord } from '#lib/catalogue/types/card-index-record.ts';
import type { EraCode } from '#lib/catalogue/types/era-code.ts';
import type { AuthorFieldErrors } from '#lib/values/types/author-field-errors.ts';
import type { EraBoundsErrors } from '#lib/values/types/era-bounds-errors.ts';
import type { ValueFormFields } from '#lib/values/types/value-form-fields.ts';

export type ValueFormErrors = {
	placeType?: string;
	name?: string;
	author?: AuthorFieldErrors;
	eraBounds?: EraBoundsErrors;
};

type Check = {
	form: ValueFormFields;
	hasPlaces: boolean;
	change?: ReturnType<typeof planNameChange>;
	creating: boolean;
	existing?: CardIndexRecord;
	kind?: string;
	era?: EraCode;
};

function nameError({ change, creating, existing, kind }: Check): string | undefined {
	if (change?.kind === 'empty') return m.valueForm.nameRequired;
	return creating && existing && kind ? m.valueForm.exists(kind, existing.name) : undefined;
}

export function valueFormErrors(check: Check): ValueFormErrors {
	const { form, hasPlaces, era } = check;
	return {
		placeType:
			hasPlaces && form.location?.placeType !== 'city' ? m.cardIndex.errors.cityType : undefined,
		name: nameError(check),
		author: form.author ? validateAuthorForm(form.author) : undefined,
		eraBounds:
			era && form.eraBounds ? validateEraBounds(era, form.eraBounds, eraJunctions()) : undefined
	};
}
