import { describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { m } from '#lib/i18n/i18n.ts';
import VisitDateField from './VisitDateField.svelte';

describe('VisitDateField', () => {
	it('groups the day, the month and the year under the date and says a year is enough', async () => {
		render(VisitDateField, { day: '12', month: '10', year: '2026', errors: {} });

		const group = page.getByRole('group', { name: m.chronicle.form.date });
		await expect.element(group).toHaveAccessibleDescription(m.chronicle.form.dateHint);
		await expect.element(group.getByLabelText(m.chronicle.form.day)).toHaveValue('12');
		await expect.element(group.getByLabelText(m.chronicle.form.month)).toHaveValue('10');
		await expect.element(group.getByLabelText(m.chronicle.form.year)).toHaveValue('2026');
		await expect
			.element(page.getByRole('option', { name: 'październik' }))
			.toHaveAttribute('value', '10');
	});

	it('shows each error under its own field', async () => {
		render(VisitDateField, {
			day: '31',
			month: '2',
			year: '',
			errors: { day: m.chronicle.form.dayInvalid, year: m.chronicle.form.yearRequired }
		});

		await expect.element(page.getByText(m.chronicle.form.dayInvalid)).toBeInTheDocument();
		await expect.element(page.getByText(m.chronicle.form.yearRequired)).toBeInTheDocument();
	});
});
