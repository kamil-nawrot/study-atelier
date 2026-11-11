import { afterEach, describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';
import { DROP_UP, placeDrop } from './drop-placement.ts';

let stage: HTMLElement;

function field(top: number, listHeight: number, bar?: number): HTMLElement {
	stage = document.createElement('div');
	const box = document.createElement('div');
	Object.assign(box.style, {
		position: 'fixed',
		top: `${top}px`,
		left: '0',
		width: '300px',
		height: '40px',
		border: '2px solid'
	});
	const list = document.createElement('ul');
	list.className = 'drop';
	list.style.height = `${listHeight}px`;
	const style = document.createElement('style');
	style.textContent = '.drop { position: absolute; top: calc(100% + 2px); left: 0; margin: 0; }';
	box.append(list);
	stage.append(style, box);
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

describe('placeDrop', () => {
	afterEach(() => stage.remove());

	it('keeps a list below its field when it fits', async () => {
		await page.viewport(800, 600);
		const list = field(100, 200, 80);

		placeDrop(list);

		expect(list.hasAttribute(DROP_UP)).toBe(false);
		expect(list.style.maxHeight).toBe('');
	});

	it('opens a list upwards when the action bar leaves no room below', async () => {
		await page.viewport(800, 600);
		const list = field(400, 200, 80);

		placeDrop(list);

		expect(list.hasAttribute(DROP_UP)).toBe(true);
		expect(list.getBoundingClientRect().bottom).toBe(400);
	});

	it('shortens a list to the room of the larger side', async () => {
		await page.viewport(800, 600);
		const list = field(250, 400, 80);

		placeDrop(list);

		expect(list.hasAttribute(DROP_UP)).toBe(true);
		expect(list.style.maxHeight).toBe('250px');
	});
});
