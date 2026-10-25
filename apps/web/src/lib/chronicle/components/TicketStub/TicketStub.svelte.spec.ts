import { describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { createRawSnippet } from 'svelte';
import TicketStub from './TicketStub.svelte';

describe('TicketStub', () => {
	it('holds what the ticket puts behind its zigzag', async () => {
		render(TicketStub, {
			children: createRawSnippet(() => ({ render: () => '<p>5 dzieł</p>' }))
		});

		await expect.element(page.getByText('5 dzieł')).toBeInTheDocument();
	});
});
