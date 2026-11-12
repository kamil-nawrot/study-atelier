import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { page } from 'vitest/browser';
import {
	bringToTop,
	FIELD_GAP,
	KEYBOARD_WAIT,
	typedField,
	watchFieldFocus
} from './field-into-view.ts';

let stage: HTMLElement;

function form(html: string): HTMLElement {
	stage = document.createElement('div');
	stage.style.setProperty('--bar-height', '60px');
	stage.innerHTML = `<div style="height: 1500px"></div>${html}<div style="height: 1500px"></div>`;
	document.body.appendChild(stage);
	return stage;
}

describe('typedField', () => {
	afterEach(() => stage.remove());

	it('takes the whole field of a text input, with its label', () => {
		form('<div class="field"><label for="n">Notatki</label><textarea id="n"></textarea></div>');

		expect(typedField(stage.querySelector('textarea'))).toBe(stage.querySelector('.field'));
	});

	it('leaves out ticks, buttons and search fields', () => {
		form('<input type="checkbox" /><input type="search" /><button type="button">Zapisz</button>');

		for (const element of stage.querySelectorAll('input, button'))
			expect(typedField(element)).toBeUndefined();
	});
});

describe('bringToTop', () => {
	afterEach(() => {
		stage.remove();
		window.scrollTo({ top: 0, behavior: 'instant' });
	});

	it('scrolls the page until the field stands just under the top bar', async () => {
		await page.viewport(390, 700);
		form('<div class="field"><textarea></textarea></div>');
		const field = stage.querySelector('.field') as HTMLElement;

		bringToTop(field, false);

		expect(field.getBoundingClientRect().top).toBeCloseTo(60 + FIELD_GAP, 0);
	});
});

describe('watchFieldFocus', () => {
	beforeEach(() => vi.useFakeTimers());

	afterEach(() => {
		vi.useRealTimers();
		stage.remove();
		window.scrollTo({ top: 0, behavior: 'instant' });
	});

	it('brings a focused field to the top once the keyboard had time to open, on a phone only', async () => {
		await page.viewport(390, 700);
		form('<div class="field"><textarea></textarea></div>');
		const scroll = vi.spyOn(window, 'scrollTo');
		const stop = watchFieldFocus();

		stage.querySelector('textarea')?.focus();
		expect(scroll).not.toHaveBeenCalled();
		vi.advanceTimersByTime(KEYBOARD_WAIT);
		expect(scroll).toHaveBeenCalledOnce();

		stop();
		scroll.mockRestore();
	});

	it('gives the page room for the keyboard while a field is focused, and takes it back on leaving', async () => {
		await page.viewport(390, 700);
		form('<div class="field"><textarea></textarea></div><button type="button">Zapisz</button>');
		const keyboard = vi
			.spyOn(window.visualViewport as VisualViewport, 'height', 'get')
			.mockReturnValue(400);
		const stop = watchFieldFocus();

		stage.querySelector('textarea')?.focus();
		vi.advanceTimersByTime(KEYBOARD_WAIT);
		expect(document.body.style.paddingBottom).toBe('300px');

		stage.querySelector('button')?.focus();
		expect(document.body.style.paddingBottom).toBe('');

		stop();
		keyboard.mockRestore();
	});

	it('leaves the page alone on a larger screen', async () => {
		await page.viewport(1280, 800);
		form('<div class="field"><textarea></textarea></div>');
		const scroll = vi.spyOn(window, 'scrollTo');
		const stop = watchFieldFocus();

		stage.querySelector('textarea')?.focus();
		vi.advanceTimersByTime(KEYBOARD_WAIT);

		expect(scroll).not.toHaveBeenCalled();
		stop();
		scroll.mockRestore();
	});
});
