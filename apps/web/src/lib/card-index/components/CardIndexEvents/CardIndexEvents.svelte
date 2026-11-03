<script lang="ts">
	import Plus from '@lucide/svelte/icons/plus';
	import { Button, Icon } from '@study-atelier/ui';
	import { resolve } from '$app/paths';
	import { m } from '#lib/i18n/i18n.ts';
	import CardIndexList from '#lib/card-index/components/CardIndexList/CardIndexList.svelte';
	import { sortsOf, type CardIndexSort } from '#lib/card-index/card-index-sort/card-index-sort.ts';

	type Props = {
		entries: { id: string; name: string; note: string; year?: number }[];
		query?: string;
		sort?: CardIndexSort;
	};

	let { entries, query = $bindable(''), sort = $bindable('name') }: Props = $props();
</script>

{#snippet adds()}
	<Button href={resolve('/(app)/atelier/timeline/events/new')}>
		<Icon icon={Plus} />
		{m.cardIndex.eventsAdd}
	</Button>
{/snippet}

<CardIndexList
	actions={adds}
	empty={m.cardIndex.emptyEvents}
	href={(id) => resolve('/(app)/atelier/timeline/events/[id]/edit', { id })}
	records={entries}
	searchLabel={m.cardIndex.search.events}
	sorts={sortsOf('events')}
	bind:query
	bind:sort
/>
