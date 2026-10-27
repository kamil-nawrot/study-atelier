import { beforeEach, describe, expect, it, vi } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { m } from '#lib/i18n/i18n.ts';
import { currentAnnouncements } from '#lib/shell/announcements-data/announcements-data.ts';
import { DISMISSED_KEY } from '#lib/shell/announcements/announcements.ts';
import AnnouncementBanner from './AnnouncementBanner.svelte';

vi.mock('#lib/shell/announcements-data/announcements-data.ts', () => ({
	currentAnnouncements: vi.fn()
}));

const maintenance = {
	id: 'maintenance',
	title: 'Przerwa techniczna',
	body: 'W sobotę od 8:00 do 9:00 atelier będzie niedostępne.'
};

beforeEach(() => {
	localStorage.removeItem(DISMISSED_KEY);
	vi.mocked(currentAnnouncements).mockReset().mockResolvedValue([maintenance]);
});

describe('AnnouncementBanner', () => {
	it('shows the current announcement with its title', async () => {
		render(AnnouncementBanner);

		await expect.element(page.getByText(maintenance.body)).toBeVisible();
		await expect.element(page.getByText(maintenance.title)).toBeVisible();
		await expect.element(page.getByText(m.announcements.label)).toBeVisible();
	});

	it('hides a dismissed announcement now and on the next visit', async () => {
		const first = await render(AnnouncementBanner);
		await page.getByRole('button', { name: m.announcements.dismissLabel }).click();
		await expect.element(page.getByText(maintenance.body)).not.toBeInTheDocument();
		first.unmount();

		render(AnnouncementBanner);
		await expect.poll(() => vi.mocked(currentAnnouncements).mock.calls.length).toBe(2);
		await expect.element(page.getByText(maintenance.body)).not.toBeInTheDocument();
	});

	it('shows nothing without announcements', async () => {
		vi.mocked(currentAnnouncements).mockResolvedValue([]);
		const { container } = await render(AnnouncementBanner);

		await expect.poll(() => vi.mocked(currentAnnouncements).mock.calls.length).toBe(1);
		expect(container.querySelector('.announcements')).toBeNull();
	});
});
