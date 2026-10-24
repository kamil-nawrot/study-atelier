import { beforeEach, describe, expect, it, vi } from 'vitest';
import { m } from '#lib/i18n/index.ts';
import { supabase } from '#lib/shared/data/supabase/supabase.ts';
import { loadPreferences, preferencesOf, savePreferences } from './preferences-data.ts';
import { defaultPreferences } from './preferences.ts';

vi.mock('#lib/shared/data/supabase/supabase.ts', () => ({
	supabase: { from: vi.fn(), auth: { signOut: vi.fn() } }
}));

const from = vi.mocked(supabase.from);

const row = {
	review_session_size: 30,
	review_new_per_day: 15,
	review_form: 'quizzes',
	review_quiz_kinds: ['quiz_pin', 'quiz_image'],
	review_free: false,
	view_show_pins: true,
	view_loupe_on: true,
	fetch_image: false,
	fetch_definition: true,
	fetch_forms: false,
	fetch_event: true
};

beforeEach(() => {
	vi.clearAllMocks();
});

describe('preferencesOf', () => {
	it('maps a row and keeps the quiz kinds in the order of the form', () => {
		expect(preferencesOf(row)).toEqual({
			reviewSessionSize: 30,
			reviewNewPerDay: 15,
			reviewForm: 'quizzes',
			reviewQuizKinds: ['quiz_image', 'quiz_pin'],
			reviewFree: false,
			viewShowPins: true,
			viewLoupeOn: true,
			fetchImage: false,
			fetchDefinition: true,
			fetchForms: false,
			fetchEvent: true
		});
	});

	it('falls back to the defaults for a learner without a row', () => {
		expect(preferencesOf(null)).toEqual(defaultPreferences);
	});

	it('falls back to the defaults for a form or kinds it does not know', () => {
		const preferences = preferencesOf({
			...row,
			review_form: 'anything',
			review_quiz_kinds: ['anything']
		});
		expect(preferences.reviewForm).toBe('mixed');
		expect(preferences.reviewQuizKinds).toEqual(defaultPreferences.reviewQuizKinds);
	});
});

describe('loadPreferences', () => {
	it('reads the preferences of the learner', async () => {
		from.mockReturnValue({
			select: () => ({ maybeSingle: () => Promise.resolve({ data: row, error: null }) })
		} as never);

		expect((await loadPreferences()).preferences.reviewSessionSize).toBe(30);
	});

	it('gives the defaults and a message when the read fails', async () => {
		from.mockReturnValue({
			select: () => ({
				maybeSingle: () => Promise.resolve({ data: null, error: { code: '500', message: 'x' } })
			})
		} as never);

		expect(await loadPreferences()).toEqual({
			preferences: defaultPreferences,
			error: m.settings.profile.failed
		});
	});
});

describe('savePreferences', () => {
	function upserting(result: unknown): ReturnType<typeof vi.fn> {
		const upsert = vi.fn(() => ({ select: () => ({ single: () => Promise.resolve(result) }) }));
		from.mockReturnValue({ upsert } as never);
		return upsert;
	}

	it('writes only the columns of the review tab', async () => {
		const upsert = upserting({ data: row, error: null });

		const result = await savePreferences('review', { ...defaultPreferences, reviewFree: false });

		expect(upsert).toHaveBeenCalledWith({
			review_session_size: 20,
			review_new_per_day: 10,
			review_form: 'mixed',
			review_quiz_kinds: defaultPreferences.reviewQuizKinds,
			review_free: false
		});
		expect(result).toEqual({ preferences: preferencesOf(row) });
	});

	it('writes only the columns of the artwork view tab', async () => {
		const upsert = upserting({ data: row, error: null });

		await savePreferences('view', { ...defaultPreferences, viewShowPins: true });

		expect(upsert).toHaveBeenCalledWith({ view_show_pins: true, view_loupe_on: false });
	});

	it('writes only the columns of the sources tab', async () => {
		const upsert = upserting({ data: row, error: null });

		await savePreferences('sources', { ...defaultPreferences, fetchForms: false });

		expect(upsert).toHaveBeenCalledWith({
			fetch_image: true,
			fetch_definition: true,
			fetch_forms: false,
			fetch_event: true
		});
	});

	it('says why a save failed', async () => {
		upserting({ data: null, error: { code: '500', message: 'x', status: 500 } });

		expect(await savePreferences('view', defaultPreferences)).toEqual({
			error: m.settings.profile.failed
		});
	});
});
