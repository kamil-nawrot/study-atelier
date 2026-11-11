import { describe, expect, it, vi } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import '@study-atelier/ui/styles.css';
import { m } from '#lib/i18n/i18n.ts';
import AddSheet from './AddSheet.svelte';

const pageState = vi.hoisted(() => ({ url: new URL('http://localhost/atelier') }));

vi.mock('$app/state', () => ({ page: pageState }));

describe('AddSheet', () => {
	it('offers the four kinds in a fixed order and highlights the one of the current module', async () => {
		pageState.url = new URL('http://localhost/atelier/chronicle');
		const { component } = await render(AddSheet);

		component.open();
		const sheet = page.getByRole('dialog', { name: m.addSheet.title });
		await expect.element(sheet).toBeVisible();

		const names = [...sheet.element().querySelectorAll('a')].map((link) =>
			link.getAttribute('aria-label')
		);
		expect(names).toEqual([m.atelier.add, m.glossary.add, m.chronicle.add, m.timeline.add]);
		await expect.element(sheet.getByRole('link', { name: m.chronicle.add })).toHaveClass('here');
		await expect
			.element(sheet.getByRole('link', { name: m.chronicle.add }))
			.toHaveAttribute('href', '/atelier/chronicle/new');
	});

	it('highlights the artwork everywhere else', async () => {
		pageState.url = new URL('http://localhost/atelier/review');
		const { component } = await render(AddSheet);

		component.open();

		await expect.element(page.getByRole('link', { name: m.atelier.add })).toHaveClass('here');
	});
});
