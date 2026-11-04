import { describe, expect, it } from 'vitest';
import { createRawSnippet } from 'svelte';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import '@study-atelier/ui/styles.css';
import SettingsSection from './SettingsSection.svelte';

const children = createRawSnippet(() => ({ render: () => '<p>Treść sekcji</p>' }));

describe('SettingsSection', () => {
	it('names the section by its heading and shows its content', async () => {
		render(SettingsSection, { title: 'Eksport', children });

		const section = page.getByRole('region', { name: 'Eksport' });
		await expect.element(section).toBeVisible();
		await expect.element(section.getByRole('heading', { level: 2 })).toHaveTextContent('Eksport');
		await expect.element(section.getByText('Treść sekcji')).toBeVisible();
	});

	it('draws a line above the section only when asked', async () => {
		render(SettingsSection, { title: 'Pierwsza', children });
		render(SettingsSection, { title: 'Druga', rule: true, children });

		const first = page.getByRole('region', { name: 'Pierwsza' }).element();
		const second = page.getByRole('region', { name: 'Druga' }).element();
		expect(getComputedStyle(first).borderTopStyle).toBe('none');
		expect(getComputedStyle(second).borderTopStyle).toBe('solid');
	});
});
