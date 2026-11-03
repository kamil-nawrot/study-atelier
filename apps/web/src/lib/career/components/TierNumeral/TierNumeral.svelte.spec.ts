import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import TierNumeral from './TierNumeral.svelte';

describe('TierNumeral', () => {
	it('shows the tier in the metal of its frame on a band hidden from screen readers', async () => {
		const { container } = await render(TierNumeral, { props: { numeral: 'IV', metal: 'silver' } });

		expect(container.querySelector('.numeral.silver')?.textContent).toBe('IV');
		expect(container.querySelector('.band')?.getAttribute('aria-hidden')).toBe('true');
		expect(container.querySelector('.mark')).toBeNull();
	});

	it('puts a mark beside the numeral', async () => {
		const { container } = await render(TierNumeral, {
			props: { numeral: 'II', metal: 'bronze', mark: 'Nowe' }
		});

		expect(container.querySelector('.band .mark')?.textContent?.trim()).toBe('Nowe');
	});
});
