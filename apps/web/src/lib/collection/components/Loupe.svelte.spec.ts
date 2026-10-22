import { afterEach, describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import '@study-atelier/ui/styles.css';
import Loupe from './Loupe.svelte';

const SMALL = `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="40" height="30"/>')}`;
const LARGE = `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="1200"/>')}`;

let frame: HTMLElement;

function renderLoupe(sourceWidth = 1600): {
	onclose: ReturnType<typeof vi.fn>;
	layer: HTMLElement;
} {
	frame = document.createElement('div');
	frame.style.position = 'relative';
	frame.style.width = '400px';
	frame.style.height = '300px';
	document.body.appendChild(frame);
	const onclose = vi.fn();
	render(Loupe, { target: frame, props: { image: SMALL, large: LARGE, sourceWidth, onclose } });
	return { onclose, layer: frame.querySelector('.loupe') as HTMLElement };
}

function point(layer: HTMLElement, x: number, y: number): void {
	const rect = layer.getBoundingClientRect();
	layer.dispatchEvent(
		new PointerEvent('pointermove', {
			pointerType: 'mouse',
			clientX: rect.left + x,
			clientY: rect.top + y,
			bubbles: true
		})
	);
}

function wheel(layer: HTMLElement, deltaY: number): void {
	layer.dispatchEvent(new WheelEvent('wheel', { deltaY, bubbles: true, cancelable: true }));
}

function level(): string | null | undefined {
	return frame.querySelector('.level')?.textContent;
}

describe('Loupe', () => {
	afterEach(() => frame.remove());

	it('shows the place under the cursor enlarged twice at first', async () => {
		const { layer } = renderLoupe();

		point(layer, 100, 150);

		await vi.waitFor(() => expect(level()).toBe('2×'));
		const glass = frame.querySelector('.glass') as HTMLElement;
		expect(glass.style.backgroundSize).toBe('800px 600px');
		expect(glass.style.backgroundPosition).toBe('-90px -190px');
	});

	it('switches to the large version once it has loaded', async () => {
		const { layer } = renderLoupe();

		point(layer, 100, 150);

		await vi.waitFor(() =>
			expect((frame.querySelector('.glass') as HTMLElement).style.backgroundImage).toContain(
				encodeURIComponent('width="1600"')
			)
		);
	});

	it('changes the level with the wheel from 1.5 up to the full resolution', async () => {
		const { layer } = renderLoupe();
		point(layer, 100, 150);

		wheel(layer, 100);
		await vi.waitFor(() => expect(level()).toBe('1,5×'));
		wheel(layer, 100);
		await vi.waitFor(() => expect(level()).toBe('1,5×'));
		for (let step = 0; step < 4; step += 1) wheel(layer, -100);
		await vi.waitFor(() => expect(level()).toBe('4×'));
	});

	it('hides the lens when the cursor leaves the image', async () => {
		const { layer } = renderLoupe();
		point(layer, 100, 150);
		await vi.waitFor(() => expect(level()).toBe('2×'));

		layer.dispatchEvent(new PointerEvent('pointerleave', { pointerType: 'mouse' }));

		await vi.waitFor(() => expect(frame.querySelector('.lens')).toBeNull());
	});

	it('switches off on Escape', () => {
		const { onclose } = renderLoupe();

		window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));

		expect(onclose).toHaveBeenCalled();
	});
});
