import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import ExhibitFrame from './ExhibitFrame.svelte';

describe('ExhibitFrame', () => {
	it('shows the engraving of the exhibit in the metal of its tier', async () => {
		const { container } = await render(ExhibitFrame, { props: { code: 'memory', metal: 'gold' } });

		expect(container.querySelector('.frame.gold')).not.toBeNull();
		expect(container.querySelector('img')?.getAttribute('src')).toMatch(
			/exhibits\/memory\/gold\.webp$/
		);
	});

	it('keeps an empty frame for an exhibit without an engraving', async () => {
		const { container } = await render(ExhibitFrame, {
			props: { code: 'unknown', metal: 'none' }
		});

		expect(container.querySelector('.frame.none')).not.toBeNull();
		expect(container.querySelector('img')).toBeNull();
	});
});
