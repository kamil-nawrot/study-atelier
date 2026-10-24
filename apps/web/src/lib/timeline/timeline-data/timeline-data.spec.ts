import { beforeEach, describe, expect, it, vi } from 'vitest';
import { m } from '#lib/i18n/i18n.ts';
import { supabase } from '#lib/shared/data/supabase/supabase.ts';
import { timelineErrorMessage } from '#lib/timeline/errors/errors.ts';
import {
	deleteTimelineEvent,
	loadTimelineEvent,
	loadTimelineEvents,
	saveTimelineEvent
} from './timeline-data.ts';
import type { TimelineEventDraft } from '#lib/timeline/types.ts';

vi.mock('#lib/shared/data/supabase/supabase.ts', () => ({
	supabase: { from: vi.fn(), auth: { signOut: vi.fn() } }
}));

const from = vi.mocked(supabase.from);

const ID = '3f2c1d4e-5a6b-4c7d-8e9f-0a1b2c3d4e5f';

function row(overrides: Record<string, unknown> = {}): Record<string, unknown> {
	return {
		id: ID,
		owner_id: 'owner',
		name: 'Wojna trzydziestoletnia',
		year_from: 1618,
		year_to: 1648,
		year_approximate: false,
		description: 'Opis.',
		source_title: null,
		source_url: null,
		source_licence: null,
		source_fetched_on: null,
		created_at: '2026-10-20T00:00:00Z',
		updated_at: '2026-10-20T00:00:00Z',
		...overrides
	};
}

function chain(result: unknown): Record<string, ReturnType<typeof vi.fn>> {
	const query: Record<string, ReturnType<typeof vi.fn>> = {};
	for (const name of ['select', 'order', 'eq', 'insert', 'update', 'delete']) {
		query[name] = vi.fn().mockReturnValue(query);
	}
	for (const name of ['range', 'maybeSingle', 'single']) {
		query[name] = vi.fn().mockResolvedValue(result);
	}
	query.then = vi.fn((resolve: (value: unknown) => unknown) => resolve(result));
	from.mockReturnValue(query as never);
	return query;
}

const draft: TimelineEventDraft = {
	name: '  Wojna trzydziestoletnia ',
	yearFrom: 1618,
	yearTo: 1648,
	yearApproximate: false,
	description: ' Opis. ',
	source: null
};

describe('loadTimelineEvents', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('reads the Wikipedia source of an event', async () => {
		chain({
			data: [
				row({
					source_title: 'Wojna trzydziestoletnia',
					source_url: 'https://pl.wikipedia.org/wiki/Wojna_trzydziestoletnia',
					source_licence: 'CC BY-SA 4.0',
					source_fetched_on: '2026-10-21'
				})
			],
			error: null
		});

		const result = await loadTimelineEvents();

		expect(result.events[0].source).toEqual({
			title: 'Wojna trzydziestoletnia',
			url: 'https://pl.wikipedia.org/wiki/Wojna_trzydziestoletnia',
			licence: 'CC BY-SA 4.0',
			fetchedOn: '2026-10-21'
		});
	});

	it('maps the rows to events ordered by their end year', async () => {
		const query = chain({
			data: [
				row(),
				row({
					id: 'other',
					name: 'Narodziny Jezusa',
					year_from: null,
					year_to: -4,
					year_approximate: true,
					description: null
				})
			],
			error: null
		});

		const result = await loadTimelineEvents();

		expect(from).toHaveBeenCalledWith('timeline_events');
		expect(query.order).toHaveBeenNthCalledWith(1, 'year_to');
		expect(result.events).toEqual([
			{
				id: ID,
				name: 'Wojna trzydziestoletnia',
				yearFrom: 1618,
				yearTo: 1648,
				yearApproximate: false,
				description: 'Opis.',
				source: null
			},
			{
				id: 'other',
				name: 'Narodziny Jezusa',
				yearFrom: null,
				yearTo: -4,
				yearApproximate: true,
				description: '',
				source: null
			}
		]);
	});

	it('gives a message and no events when loading fails', async () => {
		chain({ data: null, error: { code: '500', message: 'boom' } });

		expect(await loadTimelineEvents()).toEqual({ events: [], error: m.common.unexpectedError });
	});
});

describe('loadTimelineEvent', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('loads one event by its id', async () => {
		const query = chain({ data: row(), error: null });

		const result = await loadTimelineEvent(ID);

		expect(query.eq).toHaveBeenCalledWith('id', ID);
		expect(result.event?.name).toBe('Wojna trzydziestoletnia');
	});

	it('says an id that is not a uuid is not found without asking the database', async () => {
		expect(await loadTimelineEvent('nope')).toEqual({ notFound: true });
		expect(from).not.toHaveBeenCalled();
	});

	it('says an event that no longer exists is not found', async () => {
		chain({ data: null, error: null });

		expect(await loadTimelineEvent(ID)).toEqual({ notFound: true });
	});
});

describe('saveTimelineEvent', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('inserts a new event with a trimmed name and description', async () => {
		const query = chain({ data: { id: ID }, error: null });

		const result = await saveTimelineEvent(draft);

		expect(query.insert).toHaveBeenCalledWith({
			name: 'Wojna trzydziestoletnia',
			year_from: 1618,
			year_to: 1648,
			year_approximate: false,
			description: 'Opis.',
			source_title: null,
			source_url: null,
			source_licence: null,
			source_fetched_on: null
		});
		expect(result).toEqual({ id: ID });
	});

	it('saves the Wikipedia source of the description', async () => {
		const query = chain({ data: { id: ID }, error: null });
		const source = {
			title: 'Wojna trzydziestoletnia',
			url: 'https://pl.wikipedia.org/wiki/Wojna_trzydziestoletnia',
			licence: 'CC BY-SA 4.0',
			fetchedOn: '2026-10-21'
		};

		await saveTimelineEvent({ ...draft, source });

		expect(query.insert).toHaveBeenCalledWith(
			expect.objectContaining({
				source_title: source.title,
				source_url: source.url,
				source_licence: source.licence,
				source_fetched_on: source.fetchedOn
			})
		);
	});

	it('updates an existing event and clears an empty description', async () => {
		const query = chain({ data: { id: ID }, error: null });

		await saveTimelineEvent({ ...draft, description: '   ' }, ID);

		expect(query.update).toHaveBeenCalledWith(expect.objectContaining({ description: null }));
		expect(query.eq).toHaveBeenCalledWith('id', ID);
	});

	it('saves a span that starts and ends in the same year as a single year', async () => {
		const query = chain({ data: { id: ID }, error: null });

		await saveTimelineEvent({ ...draft, yearFrom: 1648, yearTo: 1648 });

		expect(query.insert).toHaveBeenCalledWith(
			expect.objectContaining({ year_from: null, year_to: 1648 })
		);
	});

	it('does not save an event without a year', async () => {
		expect((await saveTimelineEvent({ ...draft, yearTo: null })).error).toBe(
			m.timeline.errors.invalid
		);
		expect(from).not.toHaveBeenCalled();
	});

	it('gives a message when the database rejects the event', async () => {
		chain({ data: null, error: { code: '23514' } });

		expect(await saveTimelineEvent(draft)).toEqual({ error: m.timeline.errors.invalid });
	});

	it('signs the learner out when the session has ended', async () => {
		chain({ data: null, error: { code: 'PGRST301', status: 401 } });

		expect((await saveTimelineEvent(draft)).error).toBe(m.authErrors.sessionEnded);
		expect(supabase.auth.signOut).toHaveBeenCalled();
	});
});

describe('deleteTimelineEvent', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('deletes the event by its id', async () => {
		const query = chain({ error: null });

		expect(await deleteTimelineEvent(ID)).toEqual({});
		expect(query.delete).toHaveBeenCalled();
		expect(query.eq).toHaveBeenCalledWith('id', ID);
	});

	it('gives a message when deleting fails', async () => {
		chain({ error: { code: '500' } });

		expect(await deleteTimelineEvent(ID)).toEqual({ error: m.common.unexpectedError });
	});
});

describe('timelineErrorMessage', () => {
	it('picks a message by code and falls back to a general one', () => {
		expect(timelineErrorMessage({ code: 'PGRST116' })).toBe(m.timeline.errors.notFound);
		expect(timelineErrorMessage({ code: '23502' })).toBe(m.timeline.errors.invalid);
		expect(timelineErrorMessage({ message: 'TypeError: Failed to fetch' })).toBe(
			m.timeline.errors.network
		);
		expect(timelineErrorMessage({ code: '99999' })).toBe(m.common.unexpectedError);
	});
});
