import { afterEach, describe, expect, it } from 'vitest';
import { railExpanded, setRailExpanded } from './rail.svelte.ts';

describe('rail', () => {
	afterEach(() => {
		setRailExpanded(false);
		localStorage.clear();
	});

	it('is collapsed until the learner expands it', () => {
		expect(railExpanded()).toBe(false);
	});

	it('remembers the expanded state and forgets it on collapse', () => {
		setRailExpanded(true);

		expect(railExpanded()).toBe(true);
		expect(localStorage.getItem('study-atelier:rail-expanded')).toBe('true');

		setRailExpanded(false);

		expect(railExpanded()).toBe(false);
		expect(localStorage.getItem('study-atelier:rail-expanded')).toBeNull();
	});
});
