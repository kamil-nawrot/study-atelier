import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import '../styles/index.css';
import { PopoverState } from './popover-state.svelte.ts';

function mouse(): PointerEvent {
	return new PointerEvent('pointerleave', { pointerType: 'mouse' });
}

function setup(): { state: PopoverState; anchor: HTMLButtonElement; inside: HTMLButtonElement } {
	const anchor = document.createElement('button');
	anchor.textContent = 'Anchor';
	const card = document.createElement('div');
	const inside = document.createElement('button');
	inside.textContent = 'Inside';
	card.append(inside);
	document.body.append(anchor, card);
	const state = new PopoverState();
	state.card = card;
	state.interactive = true;
	return { state, anchor, inside };
}

beforeEach(() => {
	vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
});

afterEach(() => {
	vi.useRealTimers();
	document.body.replaceChildren();
});

describe('PopoverState', () => {
	it('opens after the hover reveal delay of a tooltip when the mouse enters the anchor', () => {
		const { state, anchor } = setup();

		state.pointerEnter(anchor, mouse());
		vi.advanceTimersByTime(319);
		expect(state.open).toBe(false);
		vi.advanceTimersByTime(1);

		expect(state.open).toBe(true);
		expect(state.anchor).toBe(anchor);
	});

	it('stays shut when the mouse leaves the anchor before the delay', () => {
		const { state, anchor } = setup();

		state.pointerEnter(anchor, mouse());
		vi.advanceTimersByTime(200);
		state.pointerLeave(mouse());
		vi.advanceTimersByTime(1000);

		expect(state.open).toBe(false);
	});

	it('moves to another anchor the mouse enters while the card is open only after the delay', () => {
		const { state, anchor } = setup();
		const other = document.createElement('button');
		document.body.append(other);
		state.show(anchor);

		state.pointerEnter(other, mouse());
		expect(state.anchor).toBe(anchor);
		vi.advanceTimersByTime(320);

		expect(state.open).toBe(true);
		expect(state.anchor).toBe(other);
	});

	it('keeps the card of the anchor when the mouse only passes over another one', () => {
		const { state, anchor } = setup();
		const other = document.createElement('button');
		document.body.append(other);
		state.show(anchor);

		state.pointerEnter(other, mouse());
		vi.advanceTimersByTime(100);
		state.pointerLeave(mouse());
		state.cardPointerEnter(mouse());
		vi.advanceTimersByTime(1000);

		expect(state.open).toBe(true);
		expect(state.anchor).toBe(anchor);
	});

	it('opens at once on keyboard focus', async () => {
		const { state, anchor } = setup();
		anchor.focus();

		state.focus(anchor);

		expect(state.anchor).toBe(anchor);
	});

	it('closes an interactive card after the delay when nothing inside holds the focus', () => {
		const { state, anchor } = setup();
		state.show(anchor);

		state.pointerLeave(mouse());
		expect(state.open).toBe(true);
		vi.advanceTimersByTime(120);

		expect(state.open).toBe(false);
	});

	it('keeps an interactive card open while the focus is inside it', () => {
		const { state, anchor, inside } = setup();
		state.show(anchor);
		inside.focus();

		state.pointerLeave(mouse());
		vi.advanceTimersByTime(120);

		expect(state.open).toBe(true);
	});

	it('keeps an interactive card open while the anchor shows the focus ring', () => {
		const { state, anchor } = setup();
		state.show(anchor);
		anchor.focus();

		state.pointerLeave(mouse());
		vi.advanceTimersByTime(120);

		expect(anchor.matches(':focus-visible')).toBe(true);
		expect(state.open).toBe(true);
	});

	it('stays open when the mouse comes back to the card before the delay', () => {
		const { state, anchor } = setup();
		state.show(anchor);

		state.pointerLeave(mouse());
		state.cardPointerEnter(mouse());
		vi.advanceTimersByTime(120);

		expect(state.open).toBe(true);
	});

	it('is ready while nothing holds it', () => {
		expect(new PopoverState().ready).toBe(true);
	});

	it('waits for every hold to be released', () => {
		const state = new PopoverState();
		const first = state.hold();
		const second = state.hold();

		first();
		first();
		expect(state.ready).toBe(false);
		second();

		expect(state.ready).toBe(true);
	});

	it('gives up waiting after half a second, so a slow card shows its loading state', () => {
		const state = new PopoverState();
		state.hold();

		vi.advanceTimersByTime(499);
		expect(state.ready).toBe(false);
		vi.advanceTimersByTime(1);

		expect(state.ready).toBe(true);
	});

	it('waits again for the next hold after a slow one was released', () => {
		const state = new PopoverState();
		const slow = state.hold();
		vi.advanceTimersByTime(500);
		slow();

		state.hold();

		expect(state.ready).toBe(false);
	});
});
