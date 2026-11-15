import { failureMessage } from '#lib/auth/expired-session-data/expired-session-data.ts';
import { ERA_CODES } from '#lib/catalogue/eras/eras.ts';
import { collectionErrorMessage } from '#lib/catalogue/errors/errors.ts';
import { supabase } from '#lib/shared/data/supabase/supabase.ts';
import type { ReviewForm } from '#lib/review/types/review-form.ts';
import type { ReviewPlan } from '#lib/review/types/review-plan.ts';
import type { PlannedScope } from '#lib/review/types/planned-scope.ts';
import type { ReviewScope } from '#lib/review/types/review-scope.ts';

type ScopeRow = { kind: string; value?: string };

type PlanRow = {
	scopes: (ScopeRow & Omit<PlannedScope, 'scope'>)[];
	free: (ScopeRow & { count: number })[];
	tomorrow: number;
};

type ReviewPlanResult = { plan?: ReviewPlan; error?: string };

export const EMPTY_PLAN: ReviewPlan = {
	scopes: [
		{ scope: { kind: 'all' }, known: 0, fresh: 0, styles: 0, years: 0, orders: 0, artworks: 0 }
	],
	free: [],
	tomorrow: 0
};

function scopeOf({ kind, value }: ScopeRow): ReviewScope | undefined {
	if (kind === 'all' || kind === 'seen') return { kind };
	if (value === undefined) return undefined;
	if (kind === 'era') {
		const code = ERA_CODES.find((era) => era === value);
		return code ? { kind, code } : undefined;
	}
	return kind === 'period' || kind === 'style' ? { kind, name: value } : undefined;
}

export function roundQuestions({ known, fresh, styles, years, orders }: PlannedScope): number {
	return known + fresh + styles + years + orders;
}

export function reviewPlanOf(row: PlanRow): ReviewPlan {
	return {
		scopes: row.scopes.flatMap(({ known, fresh, styles, years, orders, artworks, ...where }) => {
			const scope = scopeOf(where);
			return scope ? [{ scope, known, fresh, styles, years, orders, artworks }] : [];
		}),
		free: row.free.flatMap(({ count, ...where }) => {
			const scope = scopeOf(where);
			return scope ? [{ scope, count }] : [];
		}),
		tomorrow: row.tomorrow
	};
}

export async function loadReviewPlan(dayStart: Date, form: ReviewForm): Promise<ReviewPlanResult> {
	const { data, error } = await supabase.rpc('review_plan', {
		day_start: dayStart.toISOString(),
		session_form: form
	});
	if (error || !data) return { error: await failureMessage(error ?? {}, collectionErrorMessage) };
	return { plan: reviewPlanOf(data as unknown as PlanRow) };
}
