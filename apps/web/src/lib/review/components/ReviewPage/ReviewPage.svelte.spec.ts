import { describe, expect, it, vi } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { testArtwork } from '#lib/catalogue/test-artwork/test-artwork.ts';
import { m } from '#lib/i18n/i18n.ts';
import type { ReviewFlow } from '#lib/review/review-flow/review-flow.svelte.ts';
import type { ReviewSession } from '#lib/review/review-session/review-session.svelte.ts';
import type { SessionStep } from '#lib/review/types/session-step.ts';
import ReviewPage from './ReviewPage.svelte';

vi.mock('#lib/shared/data/supabase/supabase.ts', () => ({ supabase: {} }));

const milkmaid = testArtwork(1, 'The Milkmaid', { authors: ['Johannes Vermeer'] });
const astronomer = testArtwork(2, 'The Astronomer');
const bride = testArtwork(3, 'The Jewish Bride');
const watch = testArtwork(4, 'The Night Watch');

const quizOptions = [milkmaid, astronomer, bride, watch].map((artwork) => ({
	label: artwork.title,
	artwork
}));

const summary = {
	count: 2,
	minutes: 3,
	tomorrow: 4,
	groups: [{ rating: 3, artworks: [milkmaid] }],
	free: false,
	years: { asked: 0, hit: 0 },
	orders: { asked: 0, right: 0 },
	definitions: { asked: 0, right: 0 },
	notes: { asked: 0, right: 0 }
};

type FlowOverrides = Record<string, unknown>;

function startFlow(): Record<string, unknown> {
	return {
		phase: 'start',
		session: undefined,
		current: undefined,
		summary: undefined,
		startError: undefined,
		activeForm: 'mixed',
		activeScope: { kind: 'all' },
		forms: ['mixed'],
		scopes: [{ scope: { kind: 'all' }, count: 5 }],
		counts: { known: 2, fresh: 1, years: 0, orders: 0 },
		knowledge: { settled: 1, learning: 1, fresh: 1 },
		hard: [],
		missing: 0,
		freeOpen: false,
		waiting: 0,
		starting: false,
		streak: 0,
		reviewedToday: false,
		nextDate: undefined,
		now: new Date(2026, 10, 16),
		details: new Map(),
		artworksById: new Map(),
		images: { withImage: (artwork: unknown) => artwork },
		start: vi.fn(),
		chooseScope: vi.fn(),
		chooseForm: vi.fn(),
		proceed: vi.fn(),
		answer: vi.fn(),
		rate: vi.fn(),
		reveal: vi.fn(),
		guess: vi.fn(),
		typeTitle: vi.fn()
	};
}

function sessionFlow(current: SessionStep, session: Record<string, unknown> = {}): ReviewFlow {
	return {
		...startFlow(),
		phase: 'session',
		current,
		session: {
			position: 0,
			chosen: undefined,
			typed: undefined,
			guessed: undefined,
			ordered: undefined,
			revealed: false,
			saving: false,
			error: undefined,
			checkOrder: vi.fn(),
			...session
		} as unknown as ReviewSession
	} as unknown as ReviewFlow;
}

function renderPage(flow: ReviewFlow | FlowOverrides, error?: string): void {
	const full = ('phase' in flow && Object.keys(flow).length > 12
		? flow
		: { ...startFlow(), ...flow }) as unknown as ReviewFlow;
	render(ReviewPage, { flow: full, error });
}

describe('ReviewPage', () => {
	it('shows only the error when the review could not be loaded', async () => {
		renderPage({}, 'Network is down');

		await expect.element(page.getByText(m.review.loadErrorTitle)).toBeVisible();
		await expect.element(page.getByText('Network is down')).toBeVisible();
		await expect
			.element(page.getByRole('button', { name: m.review.start }))
			.not.toBeInTheDocument();
	});

	it('starts on the start screen and starts the round from it', async () => {
		const flow = startFlow();
		renderPage(flow);

		await expect.element(page.getByRole('heading', { name: m.review.waiting(3) })).toBeVisible();
		await page.getByRole('button', { name: m.review.start }).click();

		expect(flow.start).toHaveBeenCalledOnce();
	});

	it('tells when the next artworks come once the round is done', async () => {
		renderPage({
			counts: { known: 0, fresh: 0, years: 0, orders: 0 },
			nextDate: new Date(2026, 10, 17)
		});

		await expect.element(page.getByText(m.review.allDoneTitle)).toBeVisible();
	});

	it('switches the form and the scope through the flow', async () => {
		const flow = startFlow();
		flow.forms = ['mixed', 'flashcards'];
		flow.scopes = [
			{ scope: { kind: 'all' }, count: 5 },
			{ scope: { kind: 'seen' }, count: 2 }
		];
		renderPage(flow);

		await page.getByText(m.review.options).click();
		await page.getByRole('button', { name: m.review.forms.flashcards }).click();
		await page.getByRole('button', { name: new RegExp(m.atelier.filters.fields.seen) }).click();

		expect(flow.chooseForm).toHaveBeenCalledWith('flashcards');
		expect(flow.chooseScope).toHaveBeenCalledWith({ kind: 'seen' });
	});

	it('shows a flashcard for a plain artwork step', async () => {
		renderPage(sessionFlow({ artwork: milkmaid, card: null, mode: 'flashcard' }));

		await expect
			.element(page.getByRole('heading', { name: m.review.flashcard.question }))
			.toBeVisible();
	});

	it('reveals the flashcard through the flow', async () => {
		const flow = sessionFlow({ artwork: milkmaid, card: null, mode: 'flashcard' });
		renderPage(flow);

		await page.getByRole('button', { name: m.review.flashcard.reveal }).click();

		expect((flow as unknown as { reveal: ReturnType<typeof vi.fn> }).reveal).toHaveBeenCalledOnce();
	});

	it('shows a quiz for a step with a quiz and passes the answer to the flow', async () => {
		const flow = sessionFlow({
			artwork: milkmaid,
			card: null,
			mode: 'quiz_title',
			quiz: { answer: 0, options: quizOptions }
		});
		renderPage(flow);

		await expect
			.element(page.getByRole('heading', { name: m.review.quiz.titleQuestion }))
			.toBeVisible();
		await page.getByRole('button', { name: /The Astronomer/ }).click();

		expect((flow as unknown as { answer: ReturnType<typeof vi.fn> }).answer).toHaveBeenCalledWith(
			1
		);
	});

	it('shows a definition quiz for a term step', async () => {
		renderPage(
			sessionFlow({
				mode: 'quiz_definition',
				term: {
					id: 'apse',
					name: 'Apse',
					category: 'architecture',
					definition: 'The apse closes the nave of a church.',
					synonyms: [],
					forms: [],
					hasDefinition: true
				},
				quiz: {
					answer: 0,
					options: ['Apse', 'Crypt', 'Transept', 'Chancel'].map((label) => ({ label }))
				}
			})
		);

		await expect
			.element(page.getByRole('heading', { name: m.review.quiz.definitionQuestion }))
			.toBeVisible();
	});

	it('shows the order game for an order step', async () => {
		renderPage(sessionFlow({ mode: 'order', artworks: [milkmaid, astronomer, bride, watch] }));

		await expect.element(page.getByText(m.review.order.question)).toBeVisible();
	});

	it('shows the summary once the round is finished', async () => {
		const flow = startFlow();
		flow.phase = 'summary';
		flow.summary = summary;
		flow.waiting = 4;
		renderPage(flow);

		await expect
			.element(page.getByRole('heading', { level: 1 }))
			.toHaveTextContent(m.review.roundTitle(2, 3));
		await expect
			.element(page.getByRole('button', { name: m.review.start }))
			.not.toBeInTheDocument();
	});

	it('falls back to the start screen when a session has nothing current', async () => {
		const flow = startFlow();
		flow.phase = 'session';
		renderPage(flow);

		await expect.element(page.getByRole('button', { name: m.review.start })).toBeVisible();
	});
});
