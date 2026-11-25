import { afterEach, describe, expect, it, vi } from 'vitest';
import { forgetClassGroups, resolveClassGroups } from './class-groups.ts';

const fetchMock = vi.fn<typeof fetch>();

function rootsResponse(pairs: [string, string][]): Response {
	const entity = (id: string): { value: string } => ({
		value: `http://www.wikidata.org/entity/${id}`
	});
	return new Response(
		JSON.stringify({
			results: { bindings: pairs.map(([cls, root]) => ({ cls: entity(cls), root: entity(root) })) }
		})
	);
}

describe('resolveClassGroups', () => {
	afterEach(() => {
		forgetClassGroups();
		vi.unstubAllGlobals();
		fetchMock.mockReset();
	});

	it('knows the common classes of artworks and buildings without asking', async () => {
		vi.stubGlobal('fetch', fetchMock);

		const groups = await resolveClassGroups(['Q3305213', 'Q2977']);

		expect(groups.get('Q3305213')).toBe('artwork');
		expect(groups.get('Q2977')).toBe('building');
		expect(fetchMock).not.toHaveBeenCalled();
	});

	it('asks once for the classes it does not know and remembers the answer', async () => {
		vi.stubGlobal('fetch', fetchMock);
		fetchMock.mockImplementation(async () => rootsResponse([['Q888', 'Q4502142']]));

		const first = await resolveClassGroups(['Q888', 'Q3957', 'Q3305213']);
		const second = await resolveClassGroups(['Q888', 'Q3957']);

		expect(first.get('Q888')).toBe('artwork');
		expect(second.get('Q3957')).toBeNull();
		expect(fetchMock).toHaveBeenCalledOnce();
		const query = new URL(String(fetchMock.mock.calls[0][0])).searchParams.get('query');
		expect(query).toContain('VALUES ?cls { wd:Q888 wd:Q3957 }');
	});

	it('asks in batches of at most thirty classes', async () => {
		vi.stubGlobal('fetch', fetchMock);
		fetchMock.mockImplementation(async () => rootsResponse([]));

		await resolveClassGroups(Array.from({ length: 45 }, (_, index) => `Q9000${index}`));

		expect(fetchMock).toHaveBeenCalledTimes(2);
	});

	it('leaves a class unresolved when the service fails, so it is asked again next time', async () => {
		vi.stubGlobal('fetch', fetchMock);
		fetchMock.mockResolvedValue(new Response('', { status: 500 }));

		const groups = await resolveClassGroups(['Q777']);

		expect(groups.has('Q777')).toBe(false);
	});
});
