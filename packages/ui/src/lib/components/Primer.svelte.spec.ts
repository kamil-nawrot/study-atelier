import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import Primer from './Primer.svelte';

describe('Primer', () => {
	it('is decorative and exposes nothing to assistive technology', async () => {
		render(Primer);

		const primer = document.querySelector('.primer');
		expect(primer?.getAttribute('aria-hidden')).toBe('true');
		expect(primer?.textContent?.trim()).toBe('');
	});

	it('does not catch clicks meant for what is behind it', async () => {
		render(Primer);

		const primer = document.querySelector('.primer') as HTMLElement;
		expect(getComputedStyle(primer).pointerEvents).toBe('none');
	});
});
