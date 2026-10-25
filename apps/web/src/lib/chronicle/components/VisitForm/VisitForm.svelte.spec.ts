import { beforeEach, describe, expect, it, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { m } from '#lib/i18n/i18n.ts';
import { testArtwork } from '#lib/catalogue/test-artwork/test-artwork.ts';
import { saveVisit } from '#lib/chronicle/chronicle-data/chronicle-data.ts';
import { testVisit, VISIT_ID } from '#lib/testing/chronicle/chronicle.ts';
import VisitForm from './VisitForm.svelte';
import type { Visit } from '#lib/chronicle/types/visit.ts';

vi.mock('$app/navigation', () => ({ beforeNavigate: vi.fn(), goto: vi.fn() }));
vi.mock('#lib/chronicle/chronicle-data/chronicle-data.ts', () => ({ saveVisit: vi.fn() }));

const save = vi.mocked(saveVisit);

const lilies = testArtwork(1, 'Water Lilies', { location: 'Orsay' });
const dance = testArtwork(2, 'The Dance Class', { location: 'Orsay' });
const kiss = testArtwork(3, 'The Kiss', { location: 'Belvedere' });
const artworks = [lilies, dance, kiss];

function renderForm(visit?: Visit): { onsaved: ReturnType<typeof vi.fn> } {
	const onsaved = vi.fn();
	render(VisitForm, {
		visit,
		artworks,
		places: ['Orsay', 'Belvedere'],
		cancelHref: '/atelier/chronicle',
		onsaved
	});
	return { onsaved };
}

function saveButton(): ReturnType<typeof page.getByRole> {
	return page.getByRole('button', { name: m.chronicle.form.save, exact: true });
}

async function pickPlace(name: string): Promise<void> {
	await page.getByRole('combobox', { name: m.chronicle.form.place }).fill(name);
	await userEvent.click(page.getByRole('option', { name: new RegExp(name) }));
}

describe('VisitForm', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('asks for a place and a year before saving', async () => {
		renderForm();

		await userEvent.click(saveButton());

		await expect.element(page.getByText(m.chronicle.form.placeRequired)).toBeInTheDocument();
		await expect.element(page.getByText(m.chronicle.form.yearRequired)).toBeInTheDocument();
		expect(save).not.toHaveBeenCalled();
	});

	it('asks for the month of a day', async () => {
		renderForm();
		await pickPlace('Orsay');
		await page.getByLabelText(m.chronicle.form.day).fill('12');
		await page.getByLabelText(m.chronicle.form.year).fill('2026');

		await userEvent.click(saveButton());

		await expect.element(page.getByText(m.chronicle.form.monthRequired)).toBeInTheDocument();
	});

	it('ticks the artworks of the chosen place and saves the visit with them', async () => {
		save.mockResolvedValue({ id: VISIT_ID });
		const { onsaved } = renderForm();

		await pickPlace('Orsay');
		await expect.element(page.getByRole('checkbox', { name: 'Water Lilies' })).toBeChecked();
		await userEvent.click(page.getByText('The Dance Class'));
		await userEvent.selectOptions(page.getByLabelText(m.chronicle.form.month), 'październik');
		await page.getByLabelText(m.chronicle.form.year).fill('2026');
		await userEvent.click(saveButton());

		await vi.waitFor(() => expect(onsaved).toHaveBeenCalled());
		const draft = {
			place: 'Orsay',
			date: { on: '2026-10-01', precision: 'month' },
			notes: '',
			artworkIds: [lilies.id]
		};
		expect(save).toHaveBeenCalledWith(draft, undefined);
		expect(onsaved).toHaveBeenCalledWith(draft, VISIT_ID);
	});

	it('replaces the ticks of the place when the place changes', async () => {
		renderForm();

		await pickPlace('Orsay');
		await userEvent.click(page.getByRole('button', { name: m.ui.valueField.remove('Orsay') }));
		await pickPlace('Belvedere');

		await expect.element(page.getByRole('checkbox', { name: 'The Kiss' })).toBeChecked();
		await expect
			.element(page.getByRole('checkbox', { name: 'Water Lilies' }))
			.not.toBeInTheDocument();
	});

	it('shows a saved visit as it was and keeps its artworks in the trash', async () => {
		save.mockResolvedValue({ id: VISIT_ID });
		renderForm(testVisit({ place: 'Orsay', artworkIds: [dance.id, 'trashed'] }));

		await expect.element(page.getByLabelText(m.chronicle.form.day)).toHaveValue('12');
		await expect.element(page.getByLabelText(m.chronicle.form.month)).toHaveValue('10');
		await expect.element(page.getByLabelText(m.chronicle.form.year)).toHaveValue('2026');
		await expect.element(page.getByText(m.chronicle.form.placeHint)).not.toBeInTheDocument();
		await expect.element(page.getByRole('checkbox', { name: 'Water Lilies' })).not.toBeChecked();
		await expect.element(page.getByRole('checkbox', { name: 'The Dance Class' })).toBeChecked();
		await userEvent.click(saveButton());

		await vi.waitFor(() => expect(save).toHaveBeenCalled());
		expect(save.mock.calls[0][0].artworkIds).toEqual([dance.id, 'trashed']);
		expect(save.mock.calls[0][1]).toBe(VISIT_ID);
	});

	it('shows a failed save at the top of the form', async () => {
		save.mockResolvedValue({ error: m.chronicle.errors.network });
		const { onsaved } = renderForm(testVisit({ place: 'Orsay' }));

		await userEvent.click(saveButton());

		await expect.element(page.getByText(m.chronicle.form.errorTitle)).toBeInTheDocument();
		await expect.element(page.getByText(m.chronicle.errors.network)).toBeInTheDocument();
		expect(onsaved).not.toHaveBeenCalled();
	});
});
