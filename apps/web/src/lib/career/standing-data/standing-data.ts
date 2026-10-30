import { collectionErrorMessage } from '#lib/catalogue/errors/errors.ts';
import { supabase } from '#lib/shared/data/supabase/supabase.ts';
import { loadPoints, unlockExhibits } from '#lib/career/career-data/career-data.ts';
import type { RoundCareer } from '#lib/career/types/round-career.ts';
import type { Standing } from '#lib/career/types/standing.ts';

type StandingResult = { standing?: Standing; error?: string };
type RoundResult = { round?: RoundCareer; error?: string };

async function newTiers(since?: Date): Promise<{ exhibit: string; tier: number }[] | undefined> {
	let query = supabase.from('exhibit_tiers').select('exhibit, tier').is('seen_at', null);
	if (since) query = query.gte('unlocked_at', since.toISOString());
	const { data, error } = await query.order('unlocked_at').order('exhibit').order('tier');
	return error || !data ? undefined : data;
}

async function rankSeen(): Promise<number | undefined> {
	const { data, error } = await supabase.from('profiles').select('rank_seen').maybeSingle();
	return error ? undefined : (data?.rank_seen ?? 0);
}

export async function loadStanding(counted = false): Promise<StandingResult> {
	if (!counted) {
		const unlocked = await unlockExhibits();
		if (unlocked.error) return { error: unlocked.error };
	}
	const [points, tiers, seen] = await Promise.all([loadPoints(), newTiers(), rankSeen()]);
	if (points.error || tiers === undefined || seen === undefined) {
		return { error: points.error ?? collectionErrorMessage({}) };
	}
	return { standing: { points: points.points, newTiers: tiers.length, rankSeen: seen } };
}

export async function loadRoundCareer(dayStart: Date): Promise<RoundResult> {
	const unlocked = await unlockExhibits();
	if (unlocked.error) return { error: unlocked.error };
	const [plan, tiers, points, seen] = await Promise.all([
		supabase
			.from('point_events')
			.select('plan_share, streak_days')
			.eq('kind', 'plan_day')
			.eq('day_start', dayStart.toISOString())
			.maybeSingle(),
		newTiers(dayStart),
		loadPoints(),
		rankSeen()
	]);
	if (plan.error || tiers === undefined || points.error || seen === undefined) {
		return { error: points.error ?? collectionErrorMessage(plan.error ?? {}) };
	}
	return {
		round: {
			plan: plan.data
				? { share: plan.data.plan_share ?? 0, streak: plan.data.streak_days ?? 0 }
				: undefined,
			tiers,
			points: points.points,
			rankSeen: seen
		}
	};
}

export async function markRankSeen(rank: number): Promise<{ error?: string }> {
	const { error } = await supabase.from('profiles').upsert({ rank_seen: rank });
	return error ? { error: collectionErrorMessage(error) } : {};
}
