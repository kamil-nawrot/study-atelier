import { describe, expect, it, vi } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { DEFAULT_ERA_JUNCTIONS } from '#lib/catalogue/era-bounds/era-bounds.svelte.ts';
import { m } from '#lib/i18n/i18n.ts';
import { eraBoundsForm } from '#lib/values/era-bounds-form/era-bounds-form.ts';
import EraBoundsField from './EraBoundsField.svelte';

vi.mock('#lib/wall/wall-data/wall-data.ts', () => ({ loadAtelier: vi.fn() }));

async function open(): Promise<void> {
	await page.getByRole('button', { name: m.eraBounds.open }).click();
}

describe('EraBoundsField', () => {
	it('keeps the years hidden until the learner asks for them', async () => {
		render(EraBoundsField, {
			code: 'middle_ages',
			bounds: eraBoundsForm('middle_ages', DEFAULT_ERA_JUNCTIONS),
			errors: {}
		});

		await expect
			.element(page.getByLabelText(m.eraBounds.start, { exact: true }))
			.not.toBeInTheDocument();
		await open();
		await expect.element(page.getByLabelText(m.eraBounds.start, { exact: true })).toBeVisible();
	});

	it('shows the start and end of an era in between, with the hint', async () => {
		render(EraBoundsField, {
			code: 'middle_ages',
			bounds: eraBoundsForm('middle_ages', DEFAULT_ERA_JUNCTIONS),
			errors: {}
		});
		await open();

		await expect
			.element(page.getByLabelText(m.eraBounds.start, { exact: true }))
			.toHaveValue('476');
		await expect.element(page.getByLabelText(m.eraBounds.end, { exact: true })).toHaveValue('1492');
		await expect.element(page.getByText(m.eraBounds.hint)).toBeVisible();
		await expect
			.element(page.getByRole('button', { name: m.eraBounds.restore }))
			.not.toBeInTheDocument();
	});

	it('shows only the end of prehistory', async () => {
		render(EraBoundsField, {
			code: 'prehistory',
			bounds: eraBoundsForm('prehistory', DEFAULT_ERA_JUNCTIONS),
			errors: {}
		});
		await open();

		await expect.element(page.getByLabelText(m.eraBounds.end, { exact: true })).toBeVisible();
		await expect
			.element(page.getByLabelText(m.eraBounds.start, { exact: true }))
			.not.toBeInTheDocument();
	});

	it('restores the default years of the era', async () => {
		render(EraBoundsField, {
			code: 'middle_ages',
			bounds: { ...eraBoundsForm('middle_ages', DEFAULT_ERA_JUNCTIONS), endYear: '1500' },
			errors: { end: 'Wpisz rok.' }
		});
		await open();

		await expect
			.element(
				page.getByText(m.eraBounds.nextMoves(m.eras.early_modern.name, m.atelier.year(1500, false)))
			)
			.toBeVisible();
		await page.getByRole('button', { name: m.eraBounds.restore }).click();

		await expect.element(page.getByLabelText(m.eraBounds.end, { exact: true })).toHaveValue('1492');
	});
});
