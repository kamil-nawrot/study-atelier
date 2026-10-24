import { describe, expect, it } from 'vitest';
import { createRawSnippet } from 'svelte';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import '../styles/index.css';
import Frame from './Frame.svelte';

const content = createRawSnippet(() => ({ render: () => '<p>Mona Lisa</p>' }));

function frameOf(text: string): HTMLElement {
	const frame = page.getByText(text).element().closest('.frame');
	if (!frame) throw new Error('No frame around the content');
	return frame as HTMLElement;
}

describe('Frame', () => {
	it('shows what it frames', async () => {
		render(Frame, { children: content });

		await expect.element(page.getByText('Mona Lisa')).toBeVisible();
	});

	it('is the list size by default', async () => {
		render(Frame, { children: content });

		expect(frameOf('Mona Lisa').classList.contains('list')).toBe(true);
	});

	it('takes the view size', async () => {
		render(Frame, { children: content, size: 'view' });

		expect(frameOf('Mona Lisa').classList.contains('view')).toBe(true);
	});

	it('pads the view size more than the list size', async () => {
		render(Frame, { children: content });
		render(Frame, {
			children: createRawSnippet(() => ({ render: () => '<p>Night Watch</p>' })),
			size: 'view'
		});

		const padding = (text: string): number =>
			parseFloat(getComputedStyle(frameOf(text)).paddingLeft);
		expect(padding('Night Watch')).toBeGreaterThan(padding('Mona Lisa'));
	});
});
