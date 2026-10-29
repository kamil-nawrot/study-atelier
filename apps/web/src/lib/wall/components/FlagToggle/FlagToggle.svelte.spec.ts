import { describe, expect, it, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import Footprints from '@lucide/svelte/icons/footprints';
import FlagToggle from './FlagToggle.svelte';

describe('FlagToggle', () => {
	it('is a pressed tag with its label and count that reports a click', async () => {
		const onclick = vi.fn();
		render(FlagToggle, { icon: Footprints, label: 'Seen', count: 3, pressed: true, onclick });

		const toggle = page.getByRole('button', { name: /^Seen.* 3$/ });
		await expect.element(toggle).toHaveAttribute('aria-pressed', 'true');
		await userEvent.click(toggle);

		expect(onclick).toHaveBeenCalledOnce();
	});
});
