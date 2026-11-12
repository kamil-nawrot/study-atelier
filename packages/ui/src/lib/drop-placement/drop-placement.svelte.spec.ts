import { afterEach, describe, expect, it, vi } from 'vitest';
import { page } from 'vitest/browser';
import { DROP_OVER, DROP_UP, dropPlacement, placeDrop } from './drop-placement.ts';

let stage: HTMLElement;

type Field = { top: number; list: number; bar?: number; height?: number; host?: HTMLElement };

function field({ top, list: listHeight, bar, height = 40, host }: Field): HTMLElement {
	stage = document.createElement('div');
	const box = document.createElement('div');
	Object.assign(box.style, {
		position: host ? 'relative' : 'fixed',
		top: host ? '0' : `${top}px`,
		marginTop: host ? `${top}px` : '0',
		left: '0',
		width: '300px',
		height: `${height}px`,
		border: '2px solid'
	});
	const list = document.createElement('ul');
	list.className = 'drop';
	list.style.height = `${listHeight}px`;
	const style = document.createElement('style');
	style.textContent = '.drop { position: absolute; top: calc(100% + 2px); left: 0; margin: 0; }';
	box.append(list);
	stage.append(style);
	if (host) {
		host.append(box);
		stage.append(host);
	} else {
		stage.append(box);
	}
	if (bar !== undefined) {
		const footer = document.createElement('footer');
		footer.setAttribute('data-action-bar', '');
		Object.assign(footer.style, {
			position: 'fixed',
			bottom: '0',
			left: '0',
			right: '0',
			height: `${bar}px`
		});
		stage.append(footer);
	}
	document.body.append(stage);
	return list;
}

function nextFrame(): Promise<void> {
	return new Promise((resolve) => requestAnimationFrame(() => resolve()));
}

describe('placeDrop', () => {
	afterEach(() => stage.remove());

	it('keeps a list below its field when it fits', async () => {
		await page.viewport(800, 600);
		const list = field({ top: 100, list: 200, bar: 80 });

		placeDrop(list);

		expect(list.hasAttribute(DROP_UP)).toBe(false);
		expect(list.style.maxHeight).toBe('');
	});

	it('opens a list upwards when the action bar leaves no room below', async () => {
		await page.viewport(800, 600);
		const list = field({ top: 400, list: 200, bar: 80 });

		placeDrop(list);

		expect(list.hasAttribute(DROP_UP)).toBe(true);
		expect(list.getBoundingClientRect().bottom).toBe(400);
	});

	it('opens a list upwards above the bottom bar of the app', async () => {
		await page.viewport(800, 600);
		const list = field({ top: 400, list: 200 });
		const nav = document.createElement('nav');
		nav.setAttribute('data-bottom-bar', '');
		Object.assign(nav.style, {
			position: 'fixed',
			bottom: '0',
			left: '0',
			right: '0',
			height: '80px'
		});
		stage.append(nav);

		placeDrop(list);

		expect(list.hasAttribute(DROP_UP)).toBe(true);
	});

	it('opens a list upwards when its field already reaches under the action bar', async () => {
		await page.viewport(800, 600);
		const list = field({ top: 500, list: 200, bar: 80 });

		placeDrop(list);

		expect(list.hasAttribute(DROP_UP)).toBe(true);
		expect(list.getBoundingClientRect().bottom).toBe(500);
	});

	it('shortens a list to the room of the larger side', async () => {
		await page.viewport(800, 600);
		const list = field({ top: 250, list: 400, bar: 80 });

		placeDrop(list);

		expect(list.hasAttribute(DROP_UP)).toBe(true);
		expect(list.style.maxHeight).toBe('250px');
	});

	it('lays a list over its field above the bar when neither side has room', async () => {
		await page.viewport(800, 600);
		const list = field({ top: 50, list: 200, bar: 80, height: 500 });

		placeDrop(list);

		const box = list.getBoundingClientRect();
		expect(list.hasAttribute(DROP_OVER)).toBe(true);
		expect(box.bottom).toBe(520);
		expect(box.height).toBe(200);
	});

	it('clears an earlier placement once the list is hidden', async () => {
		await page.viewport(800, 600);
		const list = field({ top: 250, list: 400, bar: 80 });
		placeDrop(list);
		expect(list.hasAttribute(DROP_UP)).toBe(true);

		list.style.display = 'none';
		placeDrop(list);

		expect(list.hasAttribute(DROP_UP)).toBe(false);
		expect(list.style.maxHeight).toBe('');
		expect(list.style.bottom).toBe('');
	});

	it('measures the room down to the bottom of the screen without a bar', async () => {
		await page.viewport(800, 600);
		const list = field({ top: 300, list: 250 });

		placeDrop(list);

		expect(list.hasAttribute(DROP_UP)).toBe(false);
	});

	it('keeps a list below when the top bar takes the room above', async () => {
		await page.viewport(800, 600);
		const list = field({ top: 250, list: 400, bar: 80 });
		list.style.setProperty('--bar-height', '100px');

		placeDrop(list);

		expect(list.hasAttribute(DROP_UP)).toBe(false);
		expect(list.style.maxHeight).toBe('226px');
	});

	it('keeps a list inside the scrolled container of its field', async () => {
		await page.viewport(800, 600);
		const host = document.createElement('div');
		Object.assign(host.style, {
			position: 'fixed',
			top: '0',
			left: '0',
			width: '400px',
			height: '300px',
			overflowY: 'auto'
		});
		const list = field({ top: 200, list: 150, host });

		placeDrop(list);

		expect(list.hasAttribute(DROP_UP)).toBe(true);
		expect(list.getBoundingClientRect().top).toBeGreaterThanOrEqual(0);
	});

	it('cuts a list lying over its field to the visible area', async () => {
		await page.viewport(800, 600);
		const list = field({ top: 50, list: 600, bar: 80, height: 500 });

		placeDrop(list);

		expect(list.hasAttribute(DROP_OVER)).toBe(true);
		expect(list.style.maxHeight).toBe('520px');
	});

	it('ignores the page bars for a field in a dialog', async () => {
		await page.viewport(800, 600);
		const host = document.createElement('dialog');
		Object.assign(host.style, {
			position: 'fixed',
			inset: '0',
			margin: '0',
			padding: '0',
			border: '0',
			width: '400px',
			height: '600px',
			maxHeight: 'none'
		});
		host.setAttribute('open', '');
		const list = field({ top: 400, list: 150, bar: 80, host });
		list.style.setProperty('--bar-height', '500px');

		placeDrop(list);

		expect(list.hasAttribute(DROP_UP)).toBe(false);
		expect(list.hasAttribute(DROP_OVER)).toBe(false);
	});

	it('measures the window when the browser has no visual viewport', async () => {
		await page.viewport(800, 600);
		const original = Object.getOwnPropertyDescriptor(window, 'visualViewport');
		Object.defineProperty(window, 'visualViewport', { value: null, configurable: true });
		try {
			const list = field({ top: 400, list: 200 });

			placeDrop(list);

			expect(list.hasAttribute(DROP_UP)).toBe(true);
		} finally {
			if (original) Object.defineProperty(window, 'visualViewport', original);
			else Reflect.deleteProperty(window, 'visualViewport');
		}
	});

	it('places a list again when it shows, and stops once detached', async () => {
		await page.viewport(800, 600);
		const list = field({ top: 400, list: 200, bar: 80 });
		list.style.display = 'none';
		const detach = dropPlacement()(list);

		list.style.display = '';
		await vi.waitFor(() => expect(list.hasAttribute(DROP_UP)).toBe(true));
		if (typeof detach === 'function') detach();
		list.style.display = 'none';
		list.removeAttribute(DROP_UP);
		list.style.display = '';
		await nextFrame();
		await nextFrame();

		expect(list.hasAttribute(DROP_UP)).toBe(false);
	});
});
