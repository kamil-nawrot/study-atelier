import { describe, expect, it, vi } from 'vitest';
import { page } from 'vitest/browser';
import '@study-atelier/ui/styles.css';
import { render } from 'vitest-browser-svelte';
import { m } from '#lib/i18n/i18n.ts';
import type { TimelineEvent } from '#lib/timeline/types/timeline-event.ts';
import EventPanel from './EventPanel.svelte';

const war: TimelineEvent = {
	id: 'war',
	name: 'Wojna trzydziestoletnia',
	yearFrom: 1618,
	yearTo: 1648,
	yearApproximate: false,
	description: 'Wojna w Europie.',
	source: {
		title: 'Wojna trzydziestoletnia',
		url: 'https://pl.wikipedia.org/wiki/Wojna_trzydziestoletnia',
		licence: 'CC BY-SA 4.0',
		fetchedOn: '2026-11-20'
	}
};

const battle: TimelineEvent = {
	...war,
	id: 'battle',
	name: 'Odsiecz wiedeńska',
	yearFrom: null,
	yearTo: 1683,
	source: null
};

type Props = {
	event: TimelineEvent;
	onclose: ReturnType<typeof vi.fn>;
	onwhole: ReturnType<typeof vi.fn>;
};

async function renderPanel(event: TimelineEvent): Promise<Props> {
	const props = { event, onclose: vi.fn(), onwhole: vi.fn() };
	await render(EventPanel, { props });
	return props;
}

describe('EventPanel', () => {
	it('shows a period with its dates, description, short source and links to its page', async () => {
		await renderPanel(war);
		const panel = page.getByRole('region', { name: war.name });
		await expect.element(panel.getByText(m.timeline.card.period, { exact: true })).toBeVisible();
		await expect.element(panel.getByText('30 lat')).toBeVisible();
		await expect.element(panel.getByText(war.description as string)).toBeVisible();
		await expect.element(panel.getByText(m.timeline.card.source)).toBeVisible();
		await expect
			.element(panel.getByRole('link', { name: m.timeline.card.details }))
			.toHaveAttribute('href', '/atelier/timeline/events/war');
		await expect
			.element(panel.getByRole('link', { name: war.name }))
			.toHaveAttribute('href', '/atelier/timeline/events/war');
		expect(panel.getByRole('link', { name: /Wikipedia/ }).elements()).toHaveLength(0);
	});

	it('shows a single event without the source it lacks and without the whole period', async () => {
		await renderPanel(battle);
		const panel = page.getByRole('region', { name: battle.name });
		await expect.element(panel.getByText(m.timeline.card.event, { exact: true })).toBeVisible();
		await expect.element(panel.getByText(m.timeline.card.source)).not.toBeInTheDocument();
		await expect
			.element(panel.getByRole('button', { name: m.timeline.card.showWhole }))
			.not.toBeInTheDocument();
	});

	it('fits the axis to the period without closing', async () => {
		const props = await renderPanel(war);
		await page.getByRole('button', { name: m.timeline.card.showWhole }).click();
		expect(props.onwhole).toHaveBeenCalledOnce();
		expect(props.onclose).not.toHaveBeenCalled();
	});

	it('closes with its button and with Escape', async () => {
		const props = await renderPanel(war);
		await page.getByRole('button', { name: m.timeline.card.close }).click();
		expect(props.onclose).toHaveBeenCalledTimes(1);
		page
			.getByRole('button', { name: m.timeline.card.close })
			.element()
			.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
		expect(props.onclose).toHaveBeenCalledTimes(2);
	});
});
