import { describe, expect, it } from 'vitest';
import { symbolCover, type CoverCandidate } from './symbol-cover.ts';

function candidate(pinId: string, meaningId: string | null, createdAt: string): CoverCandidate {
	return {
		meaningId,
		createdAt,
		fragment: { pinId, artworkId: 'artwork', x: 0.5, y: 0.5, viewWidth: 0.2, text: '', image: null }
	};
}

const candidates = [
	candidate('old-death', 'death', '2026-11-01T10:00:00Z'),
	candidate('new-penance', 'penance', '2026-11-03T10:00:00Z'),
	candidate('new-death', 'death', '2026-11-02T10:00:00Z')
];

describe('symbolCover', () => {
	it('shows the main detail when the symbol has one', () => {
		expect(symbolCover(candidates, 'old-death')?.pinId).toBe('old-death');
	});

	it('shows the newest detail when no main detail is chosen', () => {
		expect(symbolCover(candidates)?.pinId).toBe('new-penance');
	});

	it('shows the newest detail when the main detail is gone', () => {
		expect(symbolCover(candidates, 'removed')?.pinId).toBe('new-penance');
	});

	it('keeps the main detail for a meaning it has', () => {
		expect(symbolCover(candidates, 'old-death', 'death')?.pinId).toBe('old-death');
	});

	it('shows the newest detail of a meaning the main detail does not have', () => {
		expect(symbolCover(candidates, 'new-penance', 'death')?.pinId).toBe('new-death');
	});

	it('shows nothing for a meaning without details', () => {
		expect(symbolCover(candidates, undefined, 'monarchy')).toBeUndefined();
	});

	it('shows nothing for a symbol without details', () => {
		expect(symbolCover([])).toBeUndefined();
	});
});
