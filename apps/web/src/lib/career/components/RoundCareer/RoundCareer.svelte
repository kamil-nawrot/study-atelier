<script lang="ts">
	import { onMount } from 'svelte';
	import { m } from '#lib/i18n/i18n.ts';
	import { career } from '#lib/career/career-state/career-state.svelte.ts';
	import { planPoints, streakBonus } from '#lib/career/plan-points/plan-points.ts';
	import { rankName, rankOf } from '#lib/career/ranks/ranks.ts';
	import { loadRoundCareer } from '#lib/career/standing-data/standing-data.ts';
	import { roman } from '#lib/timeline/labels/labels.ts';
	import type { RankForm } from '#lib/profile/types/rank-form.ts';
	import type { RoundCareer } from '#lib/career/types/round-career.ts';

	type Props = {
		form: RankForm;
		now?: () => Date;
	};

	let { form, now = () => new Date() }: Props = $props();

	let round = $state<RoundCareer>();
	let rank = $derived(round ? rankOf(round.points).level : 0);

	function exhibitName(code: string): string {
		return m.career.exhibits[code as keyof typeof m.career.exhibits]?.name ?? code;
	}

	onMount(async () => {
		const today = now();
		const loaded = await loadRoundCareer(
			new Date(today.getFullYear(), today.getMonth(), today.getDate())
		).catch(() => ({ round: undefined }));
		round = loaded.round;
		void career.refresh();
	});
</script>

{#if round}
	<div class="round">
		{#if round.plan}
			<p class="caption">
				{m.career.roundPlan(
					planPoints(round.plan.share, round.plan.streak),
					round.plan.streak,
					Math.round(streakBonus(round.plan.streak) * 100)
				)}
			</p>
		{/if}
		{#each round.tiers as unlocked (`${unlocked.exhibit}-${unlocked.tier}`)}
			<p class="caption">
				{m.career.roundTier(roman(unlocked.tier), exhibitName(unlocked.exhibit))}
			</p>
		{/each}
		{#if rank > round.rankSeen}
			<p class="caption">{m.career.roundRank(rankName(rank, form))}</p>
		{/if}
	</div>
{/if}

<style>
	.round {
		display: grid;
		gap: var(--spacing-1);
	}
</style>
