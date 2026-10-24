import { failureMessage } from '#lib/auth/expired-session/expired-session.svelte.ts';
import { supabase } from '#lib/shared/data/supabase/supabase.ts';
import type { Database } from '#lib/shared/data/database.types.ts';
import { profileErrorMessage } from '#lib/profile/errors/errors.ts';
import {
	defaultPreferences,
	QUIZ_KINDS,
	REVIEW_FORMS
} from '#lib/profile/preferences/preferences.ts';
import type {
	Preferences,
	PreferencesPart,
	PreferencesResult,
	PreferencesSaveResult
} from '#lib/profile/types.ts';
import type { QuizMode, ReviewForm } from '#lib/review/types.ts';

export const PREFERENCES_DEPENDENCY = 'preferences:own';

type Row = Pick<
	Database['public']['Tables']['profiles']['Row'],
	| 'review_session_size'
	| 'review_new_per_day'
	| 'review_form'
	| 'review_quiz_kinds'
	| 'review_free'
	| 'view_show_pins'
	| 'view_loupe_on'
	| 'fetch_image'
	| 'fetch_definition'
	| 'fetch_forms'
	| 'fetch_event'
>;

const COLUMNS =
	'review_session_size, review_new_per_day, review_form, review_quiz_kinds, review_free, view_show_pins, view_loupe_on, fetch_image, fetch_definition, fetch_forms, fetch_event';

export function preferencesOf(row: Row | null): Preferences {
	if (!row) return defaultPreferences;
	const kinds = QUIZ_KINDS.filter((kind) => row.review_quiz_kinds.includes(kind));
	return {
		reviewSessionSize: row.review_session_size,
		reviewNewPerDay: row.review_new_per_day,
		reviewForm: REVIEW_FORMS.includes(row.review_form as ReviewForm)
			? (row.review_form as ReviewForm)
			: defaultPreferences.reviewForm,
		reviewQuizKinds:
			kinds.length > 0 ? (kinds as QuizMode[]) : [...defaultPreferences.reviewQuizKinds],
		reviewFree: row.review_free,
		viewShowPins: row.view_show_pins,
		viewLoupeOn: row.view_loupe_on,
		fetchImage: row.fetch_image,
		fetchDefinition: row.fetch_definition,
		fetchForms: row.fetch_forms,
		fetchEvent: row.fetch_event
	};
}

export async function loadPreferences(): Promise<PreferencesResult> {
	const { data, error } = await supabase.from('profiles').select(COLUMNS).maybeSingle();
	if (error) return { preferences: defaultPreferences, error: profileErrorMessage(error) };
	return { preferences: preferencesOf(data) };
}

function columnsOf(part: PreferencesPart, preferences: Preferences): Partial<Row> {
	if (part === 'sources') {
		return {
			fetch_image: preferences.fetchImage,
			fetch_definition: preferences.fetchDefinition,
			fetch_forms: preferences.fetchForms,
			fetch_event: preferences.fetchEvent
		};
	}
	if (part === 'view') {
		return { view_show_pins: preferences.viewShowPins, view_loupe_on: preferences.viewLoupeOn };
	}
	return {
		review_session_size: preferences.reviewSessionSize,
		review_new_per_day: preferences.reviewNewPerDay,
		review_form: preferences.reviewForm,
		review_quiz_kinds: preferences.reviewQuizKinds,
		review_free: preferences.reviewFree
	};
}

export async function savePreferences(
	part: PreferencesPart,
	draft: Preferences
): Promise<PreferencesSaveResult> {
	const { data, error } = await supabase
		.from('profiles')
		.upsert(columnsOf(part, draft))
		.select(COLUMNS)
		.single();
	if (error) return { error: await failureMessage(error, profileErrorMessage) };
	return { preferences: preferencesOf(data) };
}
