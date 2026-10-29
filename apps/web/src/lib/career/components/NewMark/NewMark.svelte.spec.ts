import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import NewMark from './NewMark.svelte';

describe('NewMark', () => {
	it('shows a lasting mark while something is new', async () => {
		const { container } = await render(NewMark, { props: { shown: true, flash: 0 } });

		expect(container.querySelector('.mark')).not.toBeNull();
		expect(container.querySelector('.flash')).toBeNull();
	});

	it('flashes the mark when something new arrives', async () => {
		const { container } = await render(NewMark, { props: { shown: true, flash: 1 } });

		expect(container.querySelector('.mark.flash')).not.toBeNull();
	});

	it('shows nothing when nothing is new', async () => {
		const { container } = await render(NewMark, { props: { shown: false, flash: 3 } });

		expect(container.querySelector('.mark')).toBeNull();
	});
});
