import { describe, expect, it, vi } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { m } from '#lib/i18n/i18n.ts';
import type { StepKey } from '#lib/timeline/types/step-key.ts';
import TimelineControls from './TimelineControls.svelte';

const steps: StepKey[] = ['era', '10000', '1000', '300', '100', '30'];

function renderControls(step: StepKey): void {
	render(TimelineControls, {
		code: 'prehistory',
		step,
		steps,
		onera: vi.fn(),
		onstep: vi.fn(),
		onmove: vi.fn()
	});
}

describe('TimelineControls', () => {
	it('shows only the levels next to the chosen one on a phone, between the zoom buttons', async () => {
		await page.viewport(390, 800);
		renderControls('300');
		const group = page.getByRole('group', { name: m.timeline.steps.label });

		await expect
			.element(group.getByRole('button', { name: m.timeline.steps['1000'] }))
			.toBeVisible();
		await expect
			.element(group.getByRole('button', { name: m.timeline.steps['300'] }))
			.toBeVisible();
		await expect
			.element(group.getByRole('button', { name: m.timeline.steps['100'] }))
			.toBeVisible();
		await expect
			.element(group.getByRole('button', { name: m.timeline.steps.era }))
			.not.toBeInTheDocument();
		await expect.element(group.getByRole('button', { name: m.timeline.zoomIn })).toBeEnabled();
	});

	it('shows every level on a larger screen', async () => {
		await page.viewport(1280, 800);
		renderControls('era');
		const group = page.getByRole('group', { name: m.timeline.steps.label });

		await expect.element(group.getByRole('button', { name: m.timeline.steps['30'] })).toBeVisible();
		await expect.element(group.getByRole('button', { name: m.timeline.zoomOut })).toBeDisabled();
	});
});
