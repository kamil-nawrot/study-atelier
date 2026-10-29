import { afterEach, describe, expect, it, vi } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { m } from '#lib/i18n/i18n.ts';
import NewVersionNotice from './NewVersionNotice.svelte';

afterEach(() => {
	document.querySelector('[data-action-bar]')?.remove();
});

describe('NewVersionNotice', () => {
	it('says nothing while the version is the same', async () => {
		await render(NewVersionNotice, { updated: false });

		await expect.element(page.getByText(m.newVersion.message)).not.toBeInTheDocument();
	});

	it('asks the learner to reload once a new version is out and reloads on the click', async () => {
		const onreload = vi.fn();
		await render(NewVersionNotice, { updated: true, onreload });

		await expect.element(page.getByRole('status')).toHaveTextContent(m.newVersion.message);
		await page.getByRole('button', { name: m.newVersion.reload }).click();
		expect(onreload).toHaveBeenCalledOnce();
	});

	it('stands above the action bar of a form so the save button stays free', async () => {
		const bar = document.createElement('footer');
		bar.dataset.actionBar = '';
		bar.style.height = '72px';
		document.body.appendChild(bar);

		const { container } = await render(NewVersionNotice, { updated: true });

		const region = container.querySelector<HTMLElement>('.region');
		await vi.waitFor(() => expect(region?.style.getPropertyValue('--notice-offset')).toBe('72px'));
	});
});
