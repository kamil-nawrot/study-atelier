<script lang="ts">
	import Award from '@lucide/svelte/icons/award';
	import Trophy from '@lucide/svelte/icons/trophy';
	import { onMount } from 'svelte';
	import { resolve } from '$app/paths';
	import { Icon } from '@study-atelier/ui';
	import { m } from '#lib/i18n/i18n.ts';
	import { career } from '#lib/career/career-state/career-state.svelte.ts';
	import { metalOf } from '#lib/career/exhibits/exhibits.ts';
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

	const METAL_COLOURS = {
		none: 'gold',
		bronze: 'bronze',
		silver: 'silver',
		gold: 'gold',
		platinum: 'silver'
	} as const;

	function colourOf(tier: number, tiers: number | null): string {
		const metal = tiers ? metalOf(tier, tiers) : 'gold';
		return `var(--color-case-${METAL_COLOURS[metal]})`;
	}

	function exhibitName(code: string): string {
		return m.career.exhibits[code as keyof typeof m.career.exhibits]?.name ?? code;
	}

	onMount(async () => {
		const today = now();
		const loaded = await loadRoundCareer(
			new Date(today.getFullYear(), today.getMonth(), today.getDate())
		).catch(() => ({ round: undefined }));
		round = loaded.round;
		void career.refresh({ counted: true });
	});
</script>

{#if round}
	<ul class="career">
		{#each round.tiers as unlocked (`${unlocked.exhibit}-${unlocked.tier}`)}
			<li>
				<Icon icon={Trophy} />
				<span>
					{m.career.roundTier}
					<a
						style:color={colourOf(unlocked.tier, unlocked.tiers)}
						class="exhibit"
						href={resolve('/(app)/atelier/display-case')}
					>
						{m.career.roundTierName(exhibitName(unlocked.exhibit), roman(unlocked.tier))}
					</a>
				</span>
			</li>
		{/each}
		{#if rank > Math.max(round.rankSeen, 1)}
			<li>
				<Icon icon={Award} />
				<span>
					{m.career.roundRank}
					<strong class="rank">{rankName(rank, form)}</strong>
				</span>
			</li>
		{/if}
	</ul>
{/if}

<style>
	.career {
		display: grid;
		gap: var(--spacing-2);
		list-style: none;
	}

	.career:empty {
		display: none;
	}

	li {
		display: flex;
		align-items: center;
		gap: var(--spacing-3);
	}

	li > :global(svg) {
		flex: none;
		color: var(--color-fg-muted);
	}

	.exhibit {
		font-weight: var(--font-weight-bold);
	}

	.rank {
		color: var(--color-case-gold);
	}
</style>
