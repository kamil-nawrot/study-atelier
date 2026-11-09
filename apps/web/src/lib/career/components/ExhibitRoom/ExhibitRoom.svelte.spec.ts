import { describe, expect, it, vi } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { m } from '#lib/i18n/i18n.ts';
import type { Room } from '#lib/career/rooms/rooms.ts';
import ExhibitRoom from './ExhibitRoom.svelte';

const room: Room = {
	code: 'crypt',
	exhibits: [
		{ code: 'mouth_of_truth', room: 'crypt', hidden: true, value: 1, thresholds: [1], tiers: [] },
		{ code: 'candle_moths', room: 'crypt', hidden: true, value: 0, thresholds: [1], tiers: [] }
	]
};

const shownAll = { finished: true, locked: true };

describe('ExhibitRoom', () => {
	it('names the room with its number and how many exhibits are finished', async () => {
		render(ExhibitRoom, {
			props: { room, number: 7, filters: shownAll, open: true, ontoggle() {} }
		});

		const header = page.getByRole('button', { name: new RegExp(m.career.rooms.crypt) });
		await expect.element(header).toHaveAccessibleName(new RegExp(m.career.roomNumber('VII')));
		await expect.element(header).toHaveAccessibleName(new RegExp(m.career.roomFinished(1, 2)));
		await expect.element(header).toHaveAttribute('aria-expanded', 'true');
		expect(document.querySelectorAll('.square')).toHaveLength(2);
		expect(document.querySelectorAll('.square.platinum')).toHaveLength(1);
	});

	it('asks to fold on a click of its header and shows no exhibits when folded', async () => {
		const ontoggle = vi.fn();
		render(ExhibitRoom, { props: { room, number: 7, filters: shownAll, open: false, ontoggle } });

		await page.getByRole('button', { name: new RegExp(m.career.rooms.crypt) }).click();
		expect(ontoggle).toHaveBeenCalledOnce();
		await expect.element(page.getByRole('heading', { level: 3 })).not.toBeInTheDocument();
	});

	it('says when the switches hide every exhibit of the room', async () => {
		render(ExhibitRoom, {
			props: {
				room,
				number: 7,
				filters: { finished: false, locked: false },
				open: true,
				ontoggle() {}
			}
		});

		await expect.element(page.getByText(m.career.roomEmpty)).toBeVisible();
	});
});
