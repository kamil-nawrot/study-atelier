import { createRawSnippet } from 'svelte';
import { describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import '@study-atelier/ui/styles.css';
import SettingsCard from './SettingsCard.svelte';

const children = createRawSnippet(() => ({ render: () => '<p>Treść zakładki</p>' }));

describe('SettingsCard', () => {
	it('shows the tab without a bar of actions', async () => {
		render(SettingsCard, { errorTitle: 'Nie udało się zapisać', children });

		await expect.element(page.getByText('Treść zakładki')).toBeVisible();
		expect(page.getByRole('button').elements()).toHaveLength(0);
		expect(page.getByRole('alert').elements()).toHaveLength(0);
	});

	it('names a failed save above the tab', async () => {
		render(SettingsCard, { error: 'Brak sieci.', errorTitle: 'Nie udało się zapisać', children });

		await expect.element(page.getByRole('alert')).toHaveTextContent('Nie udało się zapisać');
		await expect.element(page.getByRole('alert')).toHaveTextContent('Brak sieci.');
	});
});
