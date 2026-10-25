import { describe, expect, it } from 'vitest';
import { createRawSnippet } from 'svelte';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import FormActions from './FormActions.svelte';

const actions = createRawSnippet(() => ({
	render: () => '<div><a href="#cancel">Cancel</a><button type="submit">Save</button></div>'
}));

describe('FormActions', () => {
	it('holds the actions of a form in a footer', async () => {
		render(FormActions, { children: actions });

		const footer = page.getByRole('contentinfo');
		await expect.element(footer.getByRole('link', { name: 'Cancel' })).toBeVisible();
		await expect.element(footer.getByRole('button', { name: 'Save' })).toBeVisible();
	});
});
