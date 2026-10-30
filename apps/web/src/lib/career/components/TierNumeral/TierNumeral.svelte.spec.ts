import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import TierNumeral from './TierNumeral.svelte';

describe('TierNumeral', () => {
	it('shows the tier in the metal of its frame, hidden from screen readers', async () => {
		const { container } = await render(TierNumeral, { props: { numeral: 'IV', metal: 'silver' } });

		const numeral = container.querySelector('.numeral.silver');
		expect(numeral?.textContent).toBe('IV');
		expect(numeral?.getAttribute('aria-hidden')).toBe('true');
	});
});
