import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import '@study-atelier/ui/styles.css';
import type { WallView } from '#lib/wall/wall-view/wall-view.svelte.ts';
import GroupingChoice from './GroupingChoice.svelte';

function renderChoice(fill = false): HTMLElement {
	const view = { grouping: 'none', chooseGrouping: () => undefined } as unknown as WallView;
	render(GroupingChoice, { view, fill });
	return document.querySelector('.grouping-panel') as HTMLElement;
}

describe('GroupingChoice', () => {
	it('is as wide as the three levels and wraps its hint', () => {
		const panel = renderChoice();
		const steps = panel.querySelectorAll<HTMLElement>('.step');
		const last = steps[steps.length - 1].getBoundingClientRect();
		const hint = panel.querySelector('.caption') as HTMLElement;

		expect(Math.round(panel.getBoundingClientRect().width)).toBe(
			Math.round(last.right - steps[0].getBoundingClientRect().left)
		);
		expect(hint.getBoundingClientRect().height).toBeGreaterThan(
			parseFloat(getComputedStyle(hint).lineHeight) * 1.5
		);
	});
});
