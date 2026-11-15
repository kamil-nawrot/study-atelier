import { beforeEach, describe, expect, it, vi } from 'vitest';
import { m } from '#lib/i18n/i18n.ts';
import { loadReviewPlan, reviewPlanOf, roundQuestions } from './review-plan-data.ts';

const rpc = vi.hoisted(() => vi.fn());

vi.mock('#lib/shared/data/supabase/supabase.ts', () => ({ supabase: { rpc } }));

describe('reviewPlanOf', () => {
	it('reads the scopes, the free round and tomorrow and leaves out what it does not know', () => {
		expect(
			reviewPlanOf({
				scopes: [
					{ kind: 'all', known: 12, fresh: 4, styles: 2, years: 1, orders: 1, artworks: 40 },
					{ kind: 'seen', known: 3, fresh: 0, styles: 0, years: 0, orders: 0, artworks: 22 },
					{
						kind: 'era',
						value: 'modern',
						known: 10,
						fresh: 2,
						styles: 0,
						years: 0,
						orders: 0,
						artworks: 25
					},
					{
						kind: 'era',
						value: 'future',
						known: 1,
						fresh: 0,
						styles: 0,
						years: 0,
						orders: 0,
						artworks: 20
					},
					{
						kind: 'style',
						value: 'Baroque',
						known: 11,
						fresh: 0,
						styles: 0,
						years: 0,
						orders: 0,
						artworks: 21
					},
					{ kind: 'period', known: 1, fresh: 0, styles: 0, years: 0, orders: 0, artworks: 20 },
					{
						kind: 'mood',
						value: 'Calm',
						known: 1,
						fresh: 0,
						styles: 0,
						years: 0,
						orders: 0,
						artworks: 20
					}
				],
				free: [
					{ kind: 'all', count: 30 },
					{ kind: 'period', value: 'Renaissance', count: 20 }
				],
				tomorrow: 7
			})
		).toEqual({
			scopes: [
				{
					scope: { kind: 'all' },
					known: 12,
					fresh: 4,
					styles: 2,
					years: 1,
					orders: 1,
					artworks: 40
				},
				{
					scope: { kind: 'seen' },
					known: 3,
					fresh: 0,
					styles: 0,
					years: 0,
					orders: 0,
					artworks: 22
				},
				{
					scope: { kind: 'era', code: 'modern' },
					known: 10,
					fresh: 2,
					styles: 0,
					years: 0,
					orders: 0,
					artworks: 25
				},
				{
					scope: { kind: 'style', name: 'Baroque' },
					known: 11,
					fresh: 0,
					styles: 0,
					years: 0,
					orders: 0,
					artworks: 21
				}
			],
			free: [
				{ scope: { kind: 'all' }, count: 30 },
				{ scope: { kind: 'period', name: 'Renaissance' }, count: 20 }
			],
			tomorrow: 7
		});
	});
});

describe('roundQuestions', () => {
	it('counts every question about artworks of the round', () => {
		expect(
			roundQuestions({
				scope: { kind: 'all' },
				known: 9,
				fresh: 4,
				styles: 4,
				years: 2,
				orders: 1,
				artworks: 40
			})
		).toBe(20);
	});
});

describe('loadReviewPlan', () => {
	beforeEach(() => rpc.mockReset());

	it('asks for the plan of the day and the form', async () => {
		rpc.mockResolvedValue({ data: { scopes: [], free: [], tomorrow: 0 }, error: null });
		const dayStart = new Date('2026-11-14T23:00:00.000Z');

		await expect(loadReviewPlan(dayStart, 'quizzes')).resolves.toEqual({
			plan: { scopes: [], free: [], tomorrow: 0 }
		});
		expect(rpc).toHaveBeenCalledWith('review_plan', {
			day_start: '2026-11-14T23:00:00.000Z',
			session_form: 'quizzes'
		});
	});

	it('says so when the plan cannot be read', async () => {
		rpc.mockResolvedValue({ data: null, error: { message: 'TypeError: Failed to fetch' } });

		await expect(loadReviewPlan(new Date(), 'mixed')).resolves.toEqual({
			error: m.collectionErrors.network
		});
	});
});
