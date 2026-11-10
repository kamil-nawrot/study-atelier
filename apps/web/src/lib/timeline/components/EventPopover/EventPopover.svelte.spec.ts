import { afterEach, describe, expect, it, vi } from 'vitest';
import { page } from 'vitest/browser';
import '@study-atelier/ui/styles.css';
import { render } from 'vitest-browser-svelte';
import { testArtwork } from '#lib/catalogue/test-artwork/test-artwork.ts';
import { m } from '#lib/i18n/i18n.ts';
import type { TimelineEvent } from '#lib/timeline/types/timeline-event.ts';
import EventPopover from './EventPopover.svelte';

const war: TimelineEvent = {
	id: 'war',
	name: 'Wojna trzydziestoletnia',
	yearFrom: 1618,
	yearTo: 1648,
	yearApproximate: false,
	description: 'Wojna w Europie.',
	source: null
};

const placed: HTMLElement[] = [];

function placedElement(tag: 'button' | 'div', style: string, text = ''): HTMLElement {
	const element = document.createElement(tag);
	element.setAttribute('style', `position: fixed; ${style}`);
	element.textContent = text;
	document.body.appendChild(element);
	placed.push(element);
	return element;
}

type Rendered = {
	anchor: HTMLButtonElement;
	props: {
		onclose: ReturnType<typeof vi.fn>;
		onartwork: ReturnType<typeof vi.fn>;
		onwhole: ReturnType<typeof vi.fn>;
		ondelete: ReturnType<typeof vi.fn>;
	};
};

function renderPopover(anchorStyle = 'left: 200px; top: 100px', boundary?: HTMLElement): Rendered {
	const anchor = placedElement('button', anchorStyle, war.name) as HTMLButtonElement;
	const props = {
		event: war,
		anchor,
		boundary,
		artworks: [testArtwork(1, 'Straż nocna', { yearTo: 1642, date: '1642' })],
		onclose: vi.fn(),
		onartwork: vi.fn(),
		onwhole: vi.fn(),
		ondelete: vi.fn()
	};
	render(EventPopover, { props });
	return { anchor, props };
}

function card(): ReturnType<typeof page.getByRole> {
	return page.getByRole('dialog', { name: war.name });
}

async function closesOn(
	press: (popover: ReturnType<typeof card>) => void,
	called: (props: Rendered['props']) => unknown
): Promise<void> {
	const { anchor, props } = renderPopover();
	await expect.element(card()).toBeVisible();

	press(card());

	await expect.element(card()).not.toBeInTheDocument();
	expect(document.activeElement).toBe(anchor);
	await vi.waitFor(() => expect(props.onclose).toHaveBeenCalled());
	called(props);
}

describe('EventPopover', () => {
	afterEach(() => {
		for (const element of placed.splice(0)) element.remove();
	});

	it('shows the event with its edit and delete actions as icon buttons with tooltips', async () => {
		renderPopover();

		await expect
			.element(card().getByRole('link', { name: war.name }))
			.toHaveAttribute('href', '/atelier/timeline/events/war');
		await expect
			.element(card().getByRole('link', { name: m.common.edit }))
			.toHaveAttribute('href', '/atelier/timeline/events/war/edit');
		const remove = card().getByRole('button', { name: m.common.delete });
		await expect.element(remove).toHaveAccessibleDescription(m.common.delete);
		await expect.element(remove).not.toHaveTextContent(m.common.delete);
		await expect.element(card().getByText(m.timeline.card.showWhole)).toBeVisible();
		const description = card().getByText(war.description).element();
		expect(getComputedStyle(description).getPropertyValue('-webkit-line-clamp')).toBe('6');
	});

	it('closes with Escape and gives the focus back to the event', async () => {
		await closesOn(
			(popover) => {
				const link = popover.getByRole('link', { name: war.name }).element() as HTMLElement;
				link.focus();
				link.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
			},
			() => undefined
		);
	});

	it('closes when the whole period is shown and gives the focus back to the event', async () => {
		await closesOn(
			(popover) =>
				(
					popover.getByRole('button', { name: m.timeline.card.showWhole }).element() as HTMLElement
				).click(),
			(props) => expect(props.onwhole).toHaveBeenCalledWith(war)
		);
	});

	it('closes when the delete is asked for and gives the focus back to the event', async () => {
		await closesOn(
			(popover) =>
				(popover.getByRole('button', { name: m.common.delete }).element() as HTMLElement).click(),
			(props) => expect(props.ondelete).toHaveBeenCalledWith(war)
		);
	});

	it('closes when the edit form is opened and gives the focus back to the event', async () => {
		document.addEventListener('click', (event) => event.preventDefault(), { once: true });
		await closesOn(
			(popover) =>
				(popover.getByRole('link', { name: m.common.edit }).element() as HTMLElement).click(),
			() => undefined
		);
	});

	it('hands a chosen artwork on and closes', async () => {
		const { props } = renderPopover();

		(card().getByRole('button', { name: 'Straż nocna' }).element() as HTMLElement).click();

		await expect.element(card()).not.toBeInTheDocument();
		expect(props.onartwork).toHaveBeenCalledWith(expect.objectContaining({ title: 'Straż nocna' }));
	});

	it('closes with a click outside it', async () => {
		const outside = placedElement('button', 'left: 0; bottom: 0', 'Outside');
		const { props } = renderPopover();
		await expect.element(card()).toBeVisible();

		await page.elementLocator(outside).click();

		await expect.element(card()).not.toBeInTheDocument();
		await vi.waitFor(() => expect(props.onclose).toHaveBeenCalled());
	});

	it('stays inside its boundary when the event stands at its edge', async () => {
		const boundary = placedElement('div', 'left: 100px; top: 40px; width: 500px; height: 300px');
		renderPopover('left: 560px; top: 100px', boundary);
		await expect.element(card()).toBeVisible();

		const box = card().element().getBoundingClientRect();
		expect(box.left).toBeGreaterThanOrEqual(100);
		expect(box.right).toBeLessThanOrEqual(600);
		expect(box.top).toBeGreaterThan(100);
	});
});
