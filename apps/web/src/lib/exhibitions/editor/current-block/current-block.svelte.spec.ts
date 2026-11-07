import { describe, expect, it, vi } from 'vitest';
import { EditorHarness, doc, textBlock } from '#lib/testing/exhibitions/exhibitions.ts';
import { CURRENT_CLASS } from './current-block.ts';

vi.mock('#lib/wall/wall-images/wall-images.svelte.ts', () => ({
	WallImages: class {
		apply<T>(artworks: T[]): T[] {
			return artworks;
		}
		request(): void {}
		failed(): void {}
	}
}));

describe('CurrentBlockMark', () => {
	it('marks the block the cursor is in', () => {
		const harness = new EditorHarness();
		harness.setup();
		harness.open(doc(textBlock('Alpha'), textBlock('Beta')));
		harness.placeCursor(1);

		const marked = harness.host.querySelectorAll(`.${CURRENT_CLASS}`);

		expect(marked).toHaveLength(1);
		expect(marked[0].textContent).toBe('Beta');
		harness.teardown();
	});
});
