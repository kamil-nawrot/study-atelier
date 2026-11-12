import { createRawSnippet } from 'svelte';
import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import '../../styles/index.css';
import CappedPicture from './CappedPicture.svelte';

const image = createRawSnippet(() => ({
	render: () =>
		'<img alt="Tall work" width="20" height="100" src="data:image/gif;base64,R0lGODlhAQABAAAAACw=" />'
}));

function renderPicture(ratio: number, maxHeight?: string, width = '320px'): HTMLElement {
	const host = document.createElement('div');
	host.style.width = width;
	if (maxHeight) host.style.setProperty('--picture-max-height', maxHeight);
	document.body.append(host);
	render(CappedPicture, { target: host, props: { ratio, backdrop: 'data:,', children: image } });
	return host;
}

describe('CappedPicture', () => {
	it('lays a tall image capped by the screen on a blurred backdrop in a passe-partout', async () => {
		const host = renderPicture(0.2, '300px');

		await expect.poll(() => host.querySelector('.capped')).not.toBeNull();
		expect(host.querySelector('[aria-hidden="true"] > img')).not.toBeNull();
		expect(host.querySelector('img[alt="Tall work"]')?.getBoundingClientRect().height).toBeCloseTo(
			300 - 16,
			0
		);
	});

	it('keeps the passe-partout within a grid column barely too narrow for the image', async () => {
		const host = renderPicture(0.5, '300px', '155px');
		host.style.display = 'grid';

		await expect.poll(() => host.querySelector('.capped')).not.toBeNull();
		const picture = host.querySelector('.capped-picture') as HTMLElement;
		expect(picture.getBoundingClientRect().width).toBe(155);
		expect(host.scrollWidth).toBe(155);
	});

	it('leaves an image that fits as it is', async () => {
		const host = renderPicture(1, '600px');

		await expect
			.poll(() => host.querySelector('img[alt="Tall work"]')?.getBoundingClientRect().width)
			.toBe(320);
		expect(host.querySelector('.capped')).toBeNull();
	});

	it('never caps without a maximum height', async () => {
		const host = renderPicture(0.2);

		await expect
			.poll(() => host.querySelector('img[alt="Tall work"]')?.getBoundingClientRect().width)
			.toBe(320);
		expect(host.querySelector('.capped')).toBeNull();
	});
});
