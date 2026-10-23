import { failureMessage } from '#lib/auth/expired-session.svelte.ts';
import { supabase } from '#lib/supabase.ts';
import type { Database } from '#lib/database.types.ts';
import { profileErrorMessage } from './errors.ts';
import { defaultPreferences, QUIZ_KINDS, REVIEW_FORMS } from './preferences.ts';
import type {
	Preferences,
	PreferencesPart,
	PreferencesResult,
	PreferencesSaveResult
} from './types.ts';
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
>;

const COLUMNS =
	'review_session_size, review_new_per_day, review_form, review_quiz_kinds, review_free, view_show_pins, view_loupe_on';

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
		viewLoupeOn: row.view_loupe_on
	};
}

export async function loadPreferences(): Promise<PreferencesResult> {
	const { data, error } = await supabase.from('profiles').select(COLUMNS).maybeSingle();
	if (error) return { preferences: defaultPreferences, error: profileErrorMessage(error) };
	return { preferences: preferencesOf(data) };
}

function columnsOf(part: PreferencesPart, preferences: Preferences): Partial<Row> {
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
