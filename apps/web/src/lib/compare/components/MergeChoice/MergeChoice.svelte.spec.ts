import { describe, expect, it, vi } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { createRawSnippet } from 'svelte';
import '@study-atelier/ui/styles.css';
import MergeChoice from './MergeChoice.svelte';

const children = createRawSnippet(() => ({ render: () => '<span>2025</span>' }));

describe('MergeChoice', () => {
	it('is a pressed button while picked and picks on a click', async () => {
		const onpick = vi.fn();
		await render(MergeChoice, { label: 'Zachowaj: 2025', picked: false, onpick, children });
		const button = page.getByRole('button', { name: 'Zachowaj: 2025' });

		await expect.element(button).toHaveAttribute('aria-pressed', 'false');
		await button.click();

		expect(onpick).toHaveBeenCalledOnce();
	});
});
