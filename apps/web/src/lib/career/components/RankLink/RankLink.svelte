<script lang="ts">
	import { resolve } from '$app/paths';
	import { m } from '#lib/i18n/i18n.ts';
	import NewMark from '#lib/career/components/NewMark/NewMark.svelte';
	import { progressToNext, rankName, rankOf } from '#lib/career/ranks/ranks.ts';
	import type { RankForm } from '#lib/profile/types/rank-form.ts';

	type Props = {
		points: number;
		form: RankForm;
		isNew: boolean;
		flash: number;
	};

	let { points, form, isNew, flash }: Props = $props();

	let rank = $derived(rankOf(points));
	let name = $derived(rankName(rank.level, form));
	let tip = $derived(
		rank.next === undefined
			? undefined
			: m.career.rankTip(points, rankName(rank.level + 1, form), rank.next - points)
	);
</script>

<a
	class="rank"
	aria-label={m.career.rankLabel(name, points)}
	href={resolve('/(app)/atelier/display-case')}
	title={tip}
>
	<span class="name">
		{name}
		<NewMark {flash} shown={isNew} />
	</span>
	<span class="track" aria-hidden="true">
		<span style:inline-size="{progressToNext(points) * 100}%" class="fill"></span>
	</span>
</a>

<style>
	.rank {
		display: grid;
		gap: var(--spacing-1);
		color: var(--color-fg-muted);
		font-size: var(--font-size-xs);
		line-height: var(--line-height-xs);
		text-decoration: none;
	}

	.name {
		position: relative;
		justify-self: start;
	}

	.track {
		display: block;
		block-size: var(--border-width-base);
		background: var(--color-tag);
	}

	.fill {
		display: block;
		block-size: 100%;
		background: var(--color-highlight);
	}
</style>
