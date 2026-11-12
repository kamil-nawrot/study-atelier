import { afterEach, describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';
import { AXIS_GAP, roomBelow } from './axis-room.svelte.ts';

let stage: HTMLElement;

afterEach(() => stage.remove());

describe('roomBelow', () => {
	it('measures from the top of the stage down to the bottom bar of a phone', async () => {
		await page.viewport(390, 700);
		stage = document.createElement('div');
		stage.innerHTML =
			'<div style="height: 200px"></div><div id="stage"></div><nav data-bottom-bar style="position: fixed; bottom: 0; left: 0; right: 0; height: 56px"></nav>';
		document.body.appendChild(stage);
		const box = stage.querySelector('#stage') as HTMLElement;
		const top = box.getBoundingClientRect().top + window.scrollY;

		expect(roomBelow(box)).toBe(Math.floor(700 - top - 56 - AXIS_GAP));
	});
});
