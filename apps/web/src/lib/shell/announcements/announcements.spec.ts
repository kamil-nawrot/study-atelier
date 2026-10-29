import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
	DISMISSED_KEY,
	type Announcement,
	dismissAnnouncement,
	dismissedAnnouncements,
	visibleAnnouncements
} from './announcements.ts';

const stored = new Map<string, string>();

beforeEach(() => {
	stored.clear();
	vi.stubGlobal('localStorage', {
		getItem: (key: string) => stored.get(key) ?? null,
		setItem: (key: string, value: string) => stored.set(key, value),
		removeItem: (key: string) => stored.delete(key)
	});
});

function announcement(id: string): Announcement {
	return { id, title: null, body: `Komunikat ${id}` };
}

describe('announcements', () => {
	it('hides the announcements dismissed on this device', () => {
		dismissAnnouncement('a');

		expect(
			visibleAnnouncements([announcement('a'), announcement('b')], dismissedAnnouncements())
		).toEqual([announcement('b')]);
	});

	it('remembers each dismissal once and keeps only the latest fifty', () => {
		dismissAnnouncement('a');
		dismissAnnouncement('a');
		expect(dismissedAnnouncements()).toEqual(['a']);

		for (let index = 0; index < 60; index += 1) dismissAnnouncement(`id-${index}`);
		expect(dismissedAnnouncements()).toHaveLength(50);
		expect(dismissedAnnouncements()[0]).toBe('id-59');
	});

	it('ignores a broken stored list', () => {
		stored.set(DISMISSED_KEY, '{"not": "a list"}');
		expect(dismissedAnnouncements()).toEqual([]);
	});
});
