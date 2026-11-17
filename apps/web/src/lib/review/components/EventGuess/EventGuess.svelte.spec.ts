import { describe, expect, it, vi } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { m } from '#lib/i18n/i18n.ts';
import type { EventItem } from '#lib/review/types/event-item.ts';
import EventGuess from './EventGuess.svelte';

vi.mock('#lib/shared/data/supabase/supabase.ts', () => ({ supabase: {} }));

const today = new Date('2026-11-17T12:00:00.000Z');

function item(kind: EventItem['kind']): EventItem {
	return {
		mode: 'event_year',
		kind,
		event: {
			id: 'war',
			name: 'Wojna trzydziestoletnia',
			yearFrom: 1618,
			yearTo: 1648,
			yearApproximate: false,
			description: 'Wojna w Europie Środkowej.',
			source: null
		},
		card: null
	};
}

function renderGuess(
	eventItem: EventItem,
	guessed?: number
): { onguess: ReturnType<typeof vi.fn>; onnext: ReturnType<typeof vi.fn> } {
	const onguess = vi.fn();
	const onnext = vi.fn();
	render(EventGuess, { item: eventItem, today, onguess, onnext, guessed });
	return { onguess, onnext };
}

describe('EventGuess', () => {
	it('asks for the asked end of a period within its era and hides the description', async () => {
		renderGuess(item('end'));

		await expect.element(page.getByText(m.review.event.tag)).toBeInTheDocument();
		await expect.element(page.getByText('Wojna trzydziestoletnia')).toBeInTheDocument();
		await expect
			.element(page.getByRole('heading', { name: m.review.event.questions.end }))
			.toBeInTheDocument();
		await expect.element(page.getByText(m.review.event.hint('nowożytności'))).toBeInTheDocument();
		await expect.element(page.getByText('Wojna w Europie Środkowej.')).not.toBeInTheDocument();
	});

	it('checks the year the slider starts at', async () => {
		const { onguess } = renderGuess(item('start'));

		await expect
			.element(page.getByRole('slider', { name: m.review.event.slider }))
			.toHaveValue('1641');
		await page.getByRole('button', { name: m.review.year.check }).click();
		expect(onguess).toHaveBeenCalledWith(1641);
	});

	it('rates the guess, names the real year and shows the description after the answer', async () => {
		const { onnext } = renderGuess(item('start'), 1625);

		await expect
			.element(page.getByText(`${m.review.year.results[3]} ${m.review.event.made.start('1618')}`))
			.toBeInTheDocument();
		await expect.element(page.getByText(m.review.year.miss('1625', 7, true))).toBeInTheDocument();
		await expect.element(page.getByText('Wojna w Europie Środkowej.')).toBeInTheDocument();
		await page.getByRole('button', { name: m.review.quiz.next }).click();
		expect(onnext).toHaveBeenCalled();
	});
});
