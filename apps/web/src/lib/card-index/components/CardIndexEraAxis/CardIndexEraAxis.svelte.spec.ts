import { createRawSnippet } from 'svelte';
import { describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import CardIndexEraAxis from './CardIndexEraAxis.svelte';

const children = createRawSnippet(() => ({ render: () => '<li>prehistory</li>' }));

describe('CardIndexEraAxis', () => {
	it('lists the eras it is given in order', async () => {
		render(CardIndexEraAxis, { children });

		await expect.element(page.getByRole('list')).toBeInTheDocument();
		await expect.element(page.getByRole('listitem')).toHaveTextContent('prehistory');
		expect(document.querySelector('ol')).not.toBeNull();
	});
});
