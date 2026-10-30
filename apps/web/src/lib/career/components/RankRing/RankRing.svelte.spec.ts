import { describe, expect, it } from 'vitest';
import { createRawSnippet } from 'svelte';
import { render } from 'vitest-browser-svelte';
import RankRing from './RankRing.svelte';

const avatar = createRawSnippet(() => ({ render: () => '<span class="avatar">A</span>' }));

describe('RankRing', () => {
	it('fills the border with gold as far as the way to the next rank goes', async () => {
		const { container } = await render(RankRing, { props: { progress: 0.42, children: avatar } });

		const ring = container.querySelector<HTMLElement>('.ring');
		expect(ring?.style.getPropertyValue('--progress')).toBe('42%');
		expect(ring?.textContent).toBe('A');
	});

	it('keeps the progress between empty and full', async () => {
		const { container } = await render(RankRing, { props: { progress: 3, children: avatar } });

		expect(
			container.querySelector<HTMLElement>('.ring')?.style.getPropertyValue('--progress')
		).toBe('100%');
	});
});
