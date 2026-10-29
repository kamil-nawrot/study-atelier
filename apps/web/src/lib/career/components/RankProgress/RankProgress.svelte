<script lang="ts">
	import { Meter } from '@study-atelier/ui';
	import { m } from '#lib/i18n/i18n.ts';
	import { rankName, rankOf } from '#lib/career/ranks/ranks.ts';
	import type { RankForm } from '#lib/profile/types/rank-form.ts';

	type Props = {
		points: number;
		form: RankForm;
	};

	let { points, form }: Props = $props();

	let rank = $derived(rankOf(points));
	let name = $derived(rankName(rank.level, form));
</script>

<section class="rank">
	<p class="name">{name}</p>
	{#if rank.next === undefined}
		<p class="caption">{m.career.rankTop(points)}</p>
	{:else}
		<Meter label={name} max={rank.next - rank.floor} value={points - rank.floor} />
		<p class="caption">
			{m.career.rankProgress(points, rank.next, rankName(rank.level + 1, form))}
		</p>
	{/if}
</section>

<style>
	.rank {
		display: grid;
		gap: var(--spacing-2);
		max-inline-size: var(--size-content-narrow);
	}

	.name {
		font-family: var(--font-family-title), Georgia, serif;
		font-size: var(--font-size-xl);
		font-style: italic;
		line-height: var(--line-height-xl);
	}
</style>
