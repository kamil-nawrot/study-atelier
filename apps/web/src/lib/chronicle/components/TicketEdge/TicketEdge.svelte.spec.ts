import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import TicketEdge from './TicketEdge.svelte';

describe('TicketEdge', () => {
	it('is drawn for the eye only', () => {
		render(TicketEdge, { size: 'small' });

		const edge = document.querySelector('[aria-hidden="true"]');
		expect(edge).not.toBeNull();
		expect(edge?.textContent?.trim()).toBe('');
	});
});
