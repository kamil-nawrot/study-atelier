<script lang="ts">
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
	let tip = $derived(
		rank.next === undefined
			? undefined
			: m.career.rankTip(points, rankName(rank.level + 1, form), rank.next - points)
	);
</script>

<span class="title" title={tip}>{name}</span>

<style>
	.title {
		overflow: hidden;
		font-family: var(--font-family-title), Georgia, serif;
		font-size: var(--font-size-sm);
		font-style: italic;
		line-height: var(--line-height-sm);
		text-overflow: ellipsis;
		white-space: nowrap;
	}
</style>
