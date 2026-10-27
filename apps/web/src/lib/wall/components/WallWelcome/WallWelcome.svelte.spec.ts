import { describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { m } from '#lib/i18n/i18n.ts';
import WallWelcome from './WallWelcome.svelte';

describe('WallWelcome', () => {
	it('welcomes with the first step and links it to the artwork form', async () => {
		render(WallWelcome, { addPath: '/atelier/new' });

		await expect
			.element(page.getByRole('heading', { level: 2, name: m.atelier.welcome.title }))
			.toBeVisible();
		await expect.element(page.getByText(m.atelier.welcome.text)).toBeVisible();
		await expect
			.element(page.getByRole('link', { name: m.atelier.addFirst }))
			.toHaveAttribute('href', '/atelier/new');
	});

	it('explains the three steps of learning in order', async () => {
		render(WallWelcome, { addPath: '/atelier/new' });

		await expect
			.element(page.getByRole('heading', { level: 2, name: m.atelier.welcome.howTitle }))
			.toBeVisible();
		const steps = page.getByRole('listitem');
		await expect.element(steps.nth(0)).toHaveTextContent(m.atelier.welcome.steps[0].title);
		await expect.element(steps.nth(1)).toHaveTextContent(m.atelier.welcome.steps[1].title);
		await expect.element(steps.nth(2)).toHaveTextContent(m.atelier.welcome.steps[2].title);
		await expect.element(steps.nth(2)).toHaveTextContent(m.atelier.welcome.steps[2].text);
	});
});
