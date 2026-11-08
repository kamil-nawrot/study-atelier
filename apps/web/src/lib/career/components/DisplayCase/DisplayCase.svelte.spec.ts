import { beforeEach, describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { m } from '#lib/i18n/i18n.ts';
import type { Exhibit } from '#lib/career/types/exhibit.ts';
import DisplayCase from './DisplayCase.svelte';

const exhibits: Exhibit[] = [
	{
		code: 'collection',
		room: 'main_hall',
		hidden: false,
		value: 24,
		thresholds: [1, 10, 50],
		tiers: []
	},
	{
		code: 'own_eye',
		room: 'main_hall',
		hidden: false,
		value: 100,
		thresholds: [1, 5, 25, 50, 100],
		tiers: []
	},
	{
		code: 'eras',
		room: 'era_enfilade',
		hidden: false,
		value: 1,
		thresholds: [2, 3, 4, 5, 6],
		tiers: []
	},
	{
		code: 'candle_moths',
		room: 'crypt',
		hidden: true,
		value: 0,
		thresholds: [1],
		tiers: []
	}
];

const roomButton = (name: string): ReturnType<typeof page.getByRole> =>
	page.getByRole('button', { name: new RegExp(name) });

const exhibitName = (name: string): ReturnType<typeof page.getByRole> =>
	page.getByRole('heading', { level: 3, name });

async function flip(name: string): Promise<void> {
	const toggle = page.getByRole('switch', { name });
	await expect.element(toggle).toBeInTheDocument();
	(toggle.element() as HTMLElement).click();
}

describe('DisplayCase', () => {
	beforeEach(() => localStorage.clear());

	it('shows the exhibits in numbered rooms, in the given order', async () => {
		render(DisplayCase, { props: { exhibits } });

		const rooms = page.getByRole('heading', { level: 2 });
		await expect.element(rooms.nth(0)).toHaveTextContent(m.career.roomNumber('I'));
		await expect.element(rooms.nth(0)).toHaveTextContent(m.career.rooms.main_hall);
		await expect.element(rooms.nth(2)).toHaveTextContent(m.career.roomNumber('III'));
		await expect.element(rooms.nth(2)).toHaveTextContent(m.career.rooms.crypt);
		const names = page.getByRole('heading', { level: 3 });
		await expect.element(names.nth(0)).toHaveTextContent(m.career.exhibits.collection.name);
		await expect.element(names.nth(1)).toHaveTextContent(m.career.exhibits.own_eye.name);
		await expect.element(names.nth(2)).toHaveTextContent(m.career.exhibits.eras.name);
		await expect
			.element(roomButton(m.career.rooms.main_hall))
			.toHaveAccessibleName(new RegExp(m.career.roomFinished(1, 2)));
	});

	it('folds a room and remembers it', async () => {
		const shown = await render(DisplayCase, { props: { exhibits } });

		await roomButton(m.career.rooms.main_hall).click();
		await expect
			.element(roomButton(m.career.rooms.main_hall))
			.toHaveAttribute('aria-expanded', 'false');
		await expect.element(exhibitName(m.career.exhibits.collection.name)).not.toBeInTheDocument();

		await shown.unmount();
		render(DisplayCase, { props: { exhibits } });
		await expect
			.element(roomButton(m.career.rooms.main_hall))
			.toHaveAttribute('aria-expanded', 'false');
		await expect.element(exhibitName(m.career.exhibits.eras.name)).toBeVisible();
	});

	it('hides finished and locked exhibits and says when a room is emptied', async () => {
		render(DisplayCase, { props: { exhibits } });

		await flip(m.career.showFinished);
		await expect.element(exhibitName(m.career.exhibits.own_eye.name)).not.toBeInTheDocument();
		await expect.element(exhibitName(m.career.exhibits.collection.name)).toBeVisible();

		await flip(m.career.showLocked);
		await expect.element(exhibitName(m.career.exhibits.eras.name)).not.toBeInTheDocument();
		await expect.element(page.getByText(m.career.roomEmpty).first()).toBeVisible();
		await expect.element(roomButton(m.career.rooms.crypt)).toBeVisible();
		expect(JSON.parse(localStorage.getItem('study-atelier:display-case-filters') ?? '')).toEqual({
			finished: false,
			locked: false
		});
	});

	it('marks a room with a tier not seen yet', async () => {
		render(DisplayCase, {
			props: {
				exhibits: exhibits.map((exhibit) =>
					exhibit.code === 'eras'
						? {
								...exhibit,
								value: 2,
								tiers: [{ exhibit: 'eras', tier: 1, unlockedAt: new Date(2026, 9, 1) }]
							}
						: exhibit
				)
			}
		});

		await expect
			.element(roomButton(m.career.rooms.era_enfilade))
			.toHaveAccessibleName(new RegExp(m.career.new));
		await expect
			.element(roomButton(m.career.rooms.main_hall))
			.not.toHaveAccessibleName(new RegExp(m.career.new));
	});
});
