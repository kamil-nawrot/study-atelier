import { beforeEach, describe, expect, it, vi } from 'vitest';
import { loadAtelier } from '#lib/wall/wall-data/wall-data.ts';
import { loadTimelineEvent } from '#lib/timeline/timeline-data/timeline-data.ts';
import { testArtwork } from '#lib/catalogue/test-artwork/test-artwork.ts';
import type { TimelineEvent } from '#lib/timeline/types/timeline-event.ts';
import type { EventPageData } from '#lib/timeline/event-page/event-page.ts';
import { loadRelations } from '#lib/relations/relations-data/relations-data.ts';
import { load } from './+page';

vi.mock('#lib/wall/wall-data/wall-data.ts', () => ({ loadAtelier: vi.fn() }));
vi.mock('#lib/timeline/timeline-data/timeline-data.ts', () => ({ loadTimelineEvent: vi.fn() }));
vi.mock('#lib/card-index/card-index-data/card-index-data.ts', () => ({
	loadCardIndex: vi.fn(async () => ({
		index: { values: [], periodEras: [], stylePeriods: [] },
		ownValues: []
	}))
}));
vi.mock('#lib/relations/relations-data/relations-data.ts', () => ({
	loadRelations: vi.fn(async ({ kind }: { kind: string }) => ({
		kind,
		years: [],
		groups: [],
		types: [],
		total: 0
	}))
}));

type LoadEvent = Parameters<typeof load>[0];
type Atelier = Awaited<ReturnType<typeof loadAtelier>>;

const paxRomana: TimelineEvent = {
	id: 'e',
	name: 'Pax Romana',
	yearFrom: -27,
	yearTo: 180,
	yearApproximate: true,
	description: '',
	source: null
};

const artworks = [
	testArtwork(1, 'Pantheon', { yearFrom: null, yearTo: 125 }),
	testArtwork(2, 'Ara Pacis', { yearFrom: -13, yearTo: -9 }),
	testArtwork(3, 'Parthenon', { yearFrom: -447, yearTo: -432 })
];

function loadEvent(): ReturnType<typeof load> {
	return load({ params: { id: 'e' } } as unknown as LoadEvent);
}

describe('timeline event page load', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.mocked(loadAtelier).mockResolvedValue({ artworks } as Atelier);
	});

	it('loads the event with the artworks of its time', async () => {
		vi.mocked(loadTimelineEvent).mockResolvedValue({ event: paxRomana });

		const data = (await loadEvent()) as EventPageData;

		expect(data.event).toEqual(paxRomana);
		expect(data.artworks.map((artwork) => artwork.number)).toEqual([2, 1]);
		expect(loadRelations).toHaveBeenCalledWith(
			expect.objectContaining({ kind: 'event', bounds: { from: -27, to: 180 }, eventId: 'e' })
		);
	});

	it('reports a missing event and a failed load', async () => {
		vi.mocked(loadTimelineEvent).mockResolvedValue({ notFound: true });
		expect(await loadEvent()).toEqual({ artworks: [], notFound: true });

		vi.mocked(loadTimelineEvent).mockResolvedValue({ error: 'Offline' });
		expect(await loadEvent()).toEqual({ artworks: [], error: 'Offline' });
	});
});
