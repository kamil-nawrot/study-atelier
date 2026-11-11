<script lang="ts">
	import CircleDot from '@lucide/svelte/icons/circle-dot';
	import MoveHorizontal from '@lucide/svelte/icons/move-horizontal';
	import Plus from '@lucide/svelte/icons/plus';
	import { Button } from '@study-atelier/ui';
	import { resolve } from '$app/paths';
	import { m } from '#lib/i18n/i18n.ts';
	import { eventPath } from '#lib/timeline/event-page/event-page.ts';
	import CardIndexList from '#lib/card-index/components/CardIndexList/CardIndexList.svelte';
	import { sortsOf, type CardIndexSort } from '#lib/card-index/card-index-sort/card-index-sort.ts';

	type Props = {
		entries: { id: string; name: string; note: string; year?: number; span?: boolean }[];
		query?: string;
		sort?: CardIndexSort;
	};

	let { entries, query = $bindable(''), sort = $bindable('name') }: Props = $props();

	let records = $derived(
		entries.map((entry) => ({
			...entry,
			icon: entry.span ? MoveHorizontal : CircleDot,
			iconLabel: entry.span ? m.cardIndex.eventKinds.span : m.cardIndex.eventKinds.single
		}))
	);
</script>

{#snippet adds()}
	<Button
		aria-label={m.cardIndex.eventsAdd}
		compact
		href={resolve('/(app)/atelier/timeline/events/new')}
		icon={Plus}
		variant="primary"
	>
		{m.cardIndex.eventsAdd}
	</Button>
{/snippet}

<CardIndexList
	actions={adds}
	empty={m.cardIndex.emptyEvents}
	href={eventPath}
	{records}
	searchLabel={m.cardIndex.search.events}
	sorts={sortsOf('events')}
	bind:query
	bind:sort
/>
