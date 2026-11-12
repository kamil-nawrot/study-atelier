import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import '../../styles/index.css';
import StageBackdrop from './StageBackdrop.svelte';

describe('StageBackdrop', () => {
	it('lays the image under the stage, hidden from assistive technology', () => {
		const { container } = render(StageBackdrop, { src: 'data:image/gif;base64,R0lGODlhAQABAAAAACw=' });

		const backdrop = container.querySelector('[aria-hidden="true"]');
		expect(backdrop?.querySelector('img')?.getAttribute('alt')).toBe('');
		expect(getComputedStyle(backdrop as Element).position).toBe('absolute');
	});
});
