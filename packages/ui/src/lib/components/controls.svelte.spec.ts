import { beforeEach, describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { createRawSnippet } from 'svelte';
import '../styles/index.css';
import Button from './Button.svelte';
import SearchField from './SearchField.svelte';
import Select from './Select.svelte';
import TextField from './TextField.svelte';
import ValueField from './ValueField.svelte';

function controlHeight(): number {
	const value = getComputedStyle(document.documentElement).getPropertyValue('--size-control');
	return parseFloat(value);
}

function outlinedHeight(element: Element, selector: string): number {
	const box = element.closest(selector);
	if (!box) throw new Error(`No ${selector} around the element`);
	return box.getBoundingClientRect().height;
}

const label = createRawSnippet(() => ({ render: () => '<span>Use</span>' }));

describe('single-line controls', () => {
	beforeEach(async () => {
		await page.viewport(1280, 800);
	});

	it('share one height token', () => {
		expect(controlHeight()).toBeGreaterThan(0);
	});

	it('give a button the control height', async () => {
		render(Button, { children: label });

		const button = page.getByRole('button', { name: 'Use' }).element();
		expect(button.getBoundingClientRect().height).toBe(controlHeight());
	});

	it('give a text field the control height', async () => {
		render(TextField, { label: 'Title' });

		const input = page.getByRole('textbox', { name: 'Title' }).element();
		expect(outlinedHeight(input, '.control')).toBe(controlHeight());
	});

	it('give a select the control height', async () => {
		render(Select, { label: 'Type', options: [{ value: 'painting', label: 'Painting' }] });

		const select = page.getByRole('combobox', { name: 'Type' }).element();
		expect(outlinedHeight(select, '.control')).toBe(controlHeight());
	});

	it('give a search field the control height on a phone and a computer', async () => {
		render(SearchField, { label: 'Search' });

		const search = page.getByRole('searchbox', { name: 'Search' }).element();
		expect(outlinedHeight(search, '.search')).toBe(controlHeight());

		await page.viewport(390, 844);
		expect(outlinedHeight(search, '.search')).toBe(controlHeight());
	});

	it('give an empty value field the control height', async () => {
		render(ValueField, { label: 'Authors' });

		const input = page.getByRole('combobox', { name: 'Authors' }).element();
		expect(outlinedHeight(input, '.control')).toBe(controlHeight());
	});

	it('keep a value field with one value at the control height', async () => {
		render(ValueField, { label: 'Authors', values: ['Rembrandt'] });

		const input = page.getByRole('combobox', { name: 'Authors' }).element();
		expect(outlinedHeight(input, '.control')).toBe(controlHeight());
	});
});
