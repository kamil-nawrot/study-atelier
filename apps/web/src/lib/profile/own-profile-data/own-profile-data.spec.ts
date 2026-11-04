import { beforeEach, describe, expect, it, vi } from 'vitest';
import { supabase } from '#lib/shared/data/supabase/supabase.ts';
import { profileErrorMessage } from '#lib/profile/errors/errors.ts';
import { defaultPreferences } from '#lib/profile/preferences/preferences.ts';
import { emptyProfile } from '#lib/profile/profile/profile.ts';
import { loadOwnProfile } from './own-profile-data.ts';

vi.mock('#lib/shared/data/supabase/supabase.ts', () => ({
	supabase: { from: vi.fn() }
}));

function serve(result: {
	data: unknown;
	error: unknown;
}): Record<string, ReturnType<typeof vi.fn>> {
	const query = {
		select: vi.fn(),
		maybeSingle: vi.fn().mockResolvedValue(result)
	};
	query.select.mockReturnValue(query);
	vi.mocked(supabase.from).mockReturnValue(query as never);
	return query;
}

const row = {
	review_session_size: 30,
	review_new_per_day: 15,
	review_form: 'quizzes',
	review_quiz_kinds: ['quiz_image'],
	review_free: false,
	review_glossary_questions: 2,
	review_note_questions: false,
	review_time_questions: false,
	career_shown: false,
	view_show_pins: true,
	view_loupe_on: false,
	fetch_image: false,
	fetch_definition: true,
	fetch_forms: true,
	fetch_event: true,
	display_name: 'Anna',
	avatar_path: null,
	rank_form: 'feminine',
	legal_version: '2026-10-27'
};

describe('loadOwnProfile', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('reads the preferences, the profile and the accepted terms in one request', async () => {
		const query = serve({ data: row, error: null });

		const own = await loadOwnProfile();

		expect(supabase.from).toHaveBeenCalledTimes(1);
		expect(query.select).toHaveBeenCalledWith(expect.stringContaining('legal_version'));
		expect(own.preferences).toMatchObject({ reviewSessionSize: 30, careerShown: false });
		expect(own.profile).toMatchObject({ displayName: 'Anna', avatarPath: null });
		expect(own.legalVersion).toBe('2026-10-27');
		expect(own.error).toBeUndefined();
	});

	it('gives the defaults and no accepted terms for a learner without a row', async () => {
		serve({ data: null, error: null });

		await expect(loadOwnProfile()).resolves.toEqual({
			preferences: defaultPreferences,
			profile: emptyProfile,
			legalVersion: null
		});
	});

	it('gives the defaults, an unknown terms version and a message when the read fails', async () => {
		const error = { code: 'XX000', message: 'boom' };
		serve({ data: null, error });

		const own = await loadOwnProfile();

		expect(own.preferences).toEqual(defaultPreferences);
		expect(own.legalVersion).toBeUndefined();
		expect(own.error).toBe(profileErrorMessage(error));
	});
});
