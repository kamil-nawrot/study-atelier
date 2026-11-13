import { beforeEach, describe, expect, it, vi } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { goto } from '$app/navigation';
import { m } from '#lib/i18n/i18n.ts';
import { deleteValue } from '#lib/card-index/card-index-data/card-index-data.ts';
import ValueDeleteAction from './ValueDeleteAction.svelte';

vi.mock('$app/navigation', () => ({ goto: vi.fn() }));
vi.mock('#lib/card-index/card-index-data/card-index-data.ts', () => ({ deleteValue: vi.fn() }));

const city = { id: 'paris', category: 'location' as const, name: 'Paryż', count: 0 };

describe('ValueDeleteAction', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.mocked(deleteValue).mockResolvedValue({});
	});

	it('explains that a city with places cannot be deleted', async () => {
		await page.viewport(1280, 800);
		render(ValueDeleteAction, {
			props: { record: city, places: [{ id: 'louvre', name: 'Luwr', count: 2 }] }
		});

		await page.getByRole('button', { name: m.common.delete }).hover();

		await expect.element(page.getByText(m.valuePage.cityDeleteBlocked(0, 1))).toBeInTheDocument();
	});

	it('deletes a city without places after the learner confirms', async () => {
		await page.viewport(1280, 800);
		render(ValueDeleteAction, { props: { record: city, places: [] } });

		await page.getByRole('button', { name: m.common.delete }).click();
		await page.getByRole('alertdialog').getByRole('button', { name: m.common.delete }).click();

		expect(deleteValue).toHaveBeenCalledWith(city);
		expect(goto).toHaveBeenCalledWith('/atelier/values', {
			refreshAll: true,
			state: { valueMessage: m.cardIndex.deleted('Paryż') }
		});
	});
});
