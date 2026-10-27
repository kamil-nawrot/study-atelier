import { beforeEach, describe, expect, it, vi } from 'vitest';
import { m } from '#lib/i18n/i18n.ts';
import { supabase } from '#lib/shared/data/supabase/supabase.ts';
import { sendFeedback } from './feedback-data.ts';

vi.mock('#lib/shared/data/supabase/supabase.ts', () => ({
	supabase: { from: vi.fn(), auth: { signOut: vi.fn() } }
}));

const from = vi.mocked(supabase.from);

function insertResult(result: unknown): ReturnType<typeof vi.fn> {
	const insert = vi.fn().mockResolvedValue(result);
	from.mockReturnValue({ insert } as never);
	return insert;
}

describe('sendFeedback', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('inserts the trimmed report', async () => {
		const insert = insertResult({ error: null });

		const result = await sendFeedback(
			{
				kind: 'bug',
				title: '  Broken filter ',
				description: ' Details '
			},
			'Mozilla/5.0 Firefox/140.0'
		);

		expect(result).toEqual({});
		expect(from).toHaveBeenCalledWith('feedback');
		expect(insert).toHaveBeenCalledWith({
			kind: 'bug',
			title: 'Broken filter',
			description: 'Details',
			browser: 'Mozilla/5.0 Firefox/140.0'
		});
	});

	it('stores an empty description and an unknown browser as null', async () => {
		const insert = insertResult({ error: null });

		await sendFeedback({ kind: 'idea', title: 'Dark mode', description: '  ' }, '');

		expect(insert).toHaveBeenCalledWith({
			kind: 'idea',
			title: 'Dark mode',
			description: null,
			browser: null
		});
	});

	it('reports a failed insert with a dictionary message', async () => {
		insertResult({ error: { code: '23514', message: 'raw' } });

		const result = await sendFeedback({ kind: 'bug', title: 'x', description: '' });

		expect(result).toEqual({ error: m.feedback.errors.invalid });
	});

	it('does not call the database without a kind', async () => {
		const result = await sendFeedback({ kind: null, title: 'x', description: '' });

		expect(result.error).toBe(m.feedback.errors.invalid);
		expect(from).not.toHaveBeenCalled();
	});
});
