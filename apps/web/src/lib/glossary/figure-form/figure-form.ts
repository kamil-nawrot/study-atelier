import {
	AUTHOR_COUNTRY_MAX_LENGTH,
	emptyLifeForm,
	lifeFormFromYears,
	lifeYearsFromForm
} from '#lib/values/author-form/author-form.ts';
import type { FigureDetails } from '#lib/glossary/types/figure-details.ts';
import type { FigureDraft } from '#lib/glossary/types/figure-draft.ts';

export const FIGURE_COUNTRY_MAX_LENGTH = AUTHOR_COUNTRY_MAX_LENGTH;

export function emptyFigureDraft(): FigureDraft {
	return { ...emptyLifeForm(), country: '', image: null };
}

export function figureDraftOf(details: FigureDetails | undefined): FigureDraft {
	if (!details) return emptyFigureDraft();
	return {
		...lifeFormFromYears(details.birthYear, details.deathYear, details.yearsApproximate),
		country: details.country ?? '',
		image: details.image
	};
}

export function figureDetailsOf(draft: FigureDraft): FigureDetails {
	const country = draft.country.trim();
	return {
		...lifeYearsFromForm(draft),
		country: country === '' ? null : country,
		image: draft.image
	};
}

export function figureDraftChanged(current: FigureDraft, reference: FigureDraft): boolean {
	return JSON.stringify(figureDetailsOf(current)) !== JSON.stringify(figureDetailsOf(reference));
}
