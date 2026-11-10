<script lang="ts">
	import { onMount, untrack } from 'svelte';
	import { MediaQuery } from 'svelte/reactivity';
	import { Alert, PageHeader, Toast } from '@study-atelier/ui';
	import { goto, invalidateAll } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import AtelierLayout from '#lib/shell/AtelierLayout/AtelierLayout.svelte';
	import FilterSidePanel from '#lib/wall/components/FilterSidePanel/FilterSidePanel.svelte';
	import { m } from '#lib/i18n/i18n.ts';
	import TimelineFilterDialog from '#lib/timeline/components/TimelineFilterDialog/TimelineFilterDialog.svelte';
	import TimelineEmpty from '#lib/timeline/components/TimelineEmpty/TimelineEmpty.svelte';
	import TimelineFilterButton from '#lib/timeline/components/TimelineFilterButton/TimelineFilterButton.svelte';
	import TimelineFilterPanel from '#lib/timeline/components/TimelineFilterPanel/TimelineFilterPanel.svelte';
	import TimelineTools from '#lib/timeline/components/TimelineTools/TimelineTools.svelte';
	import TimelineView from '#lib/timeline/components/TimelineView/TimelineView.svelte';
	import {
		applyTimelineFilter,
		artworksIn,
		emptyTimelineFilter,
		isEmptyTimelineFilter
	} from '#lib/timeline/filter/filter.ts';
	import { eraOfYear, rememberEra, rememberedEra, startEra } from '#lib/timeline/start/start.ts';
	import { entriesSpan, eraOf, spanOfYears } from '#lib/timeline/time/time.ts';
	import type { TimelineEvent } from '#lib/timeline/types/timeline-event.ts';
	import type { TimelineFilter } from '#lib/timeline/types/timeline-filter.ts';
	import type { TimelinePlace } from '#lib/timeline/types/timeline-place.ts';
	import type { PageProps, Snapshot } from './$types';

	let { data }: PageProps = $props();

	const timelinePath = resolve('/(app)/atelier/timeline');
	const saved = untrack(() => page.state.timelineEvent);
	const initialEra = untrack(() =>
		saved ? eraOfYear(saved.yearTo) : startEra(data.artworks, rememberedEra())
	);
	const initialFocus = saved ? spanOfYears(saved.yearFrom, saved.yearTo) : undefined;

	let toast: Toast;
	let era = $state(initialEra);
	let filter = $state(emptyTimelineFilter());
	let showEvents = $state(true);
	let panelOpen = $state(false);
	let timelineView = $state<TimelineView>();

	type Saved = {
		place?: TimelinePlace;
		filter: TimelineFilter;
		showEvents: boolean;
	};

	export const snapshot: Snapshot<Saved> = {
		capture: () => ({ place: timelineView?.capture(), filter, showEvents }),
		restore: (value) => {
			filter = value.filter;
			showEvents = value.showEvents;
			if (value.place) timelineView?.restore(value.place);
		}
	};
	let dialogOpen = $state(false);

	const wide = new MediaQuery('min-width: 768px');

	$effect(() => {
		if (wide.current) dialogOpen = false;
	});

	let eraArtworks = $derived(
		artworksIn(
			data.artworks,
			eraOf(era, undefined, entriesSpan([...data.artworks, ...data.events]))
		)
	);
	let matching = $derived(applyTimelineFilter(eraArtworks, filter).length);
	let filtering = $derived(!isEmptyTimelineFilter(filter));

	async function removed(event: TimelineEvent): Promise<void> {
		await invalidateAll();
		toast.show(m.timeline.deleted(event.name));
	}

	onMount(() => {
		if (!saved) return;
		rememberEra(initialEra);
		toast.show(saved.message);
		void goto(timelinePath, { state: {}, shallow: true, replace: true });
	});
</script>

{#snippet filterButton()}
	<TimelineFilterButton
		{filter}
		{filtering}
		ondialog={() => (dialogOpen = true)}
		wide={wide.current}
		bind:panelOpen
	/>
{/snippet}

<AtelierLayout email={data.session.user.email ?? ''} title={m.timeline.title}>
	{#snippet bar()}
		{#if !data.error}
			<TimelineTools />
		{/if}
	{/snippet}

	{#snippet panel()}
		{#if wide.current && !data.error && !data.empty}
			<FilterSidePanel
				{filtering}
				onclear={() => (filter = emptyTimelineFilter())}
				bind:open={panelOpen}
			>
				<TimelineFilterPanel artworks={eraArtworks} {era} bind:filter bind:showEvents />
			</FilterSidePanel>
		{/if}
	{/snippet}

	<PageHeader
		actions={data.error || data.empty ? undefined : filterButton}
		lead={m.timeline.lead}
		title={m.timeline.title}
	/>

	{#if data.error}
		<Alert title={m.timeline.loadErrorTitle} tone="danger">
			{data.error}
		</Alert>
	{:else if data.empty}
		<TimelineEmpty />
	{:else}
		<TimelineView
			bind:this={timelineView}
			artworks={data.artworks}
			events={data.events}
			{initialEra}
			{initialFocus}
			ondeleted={removed}
			onerachange={(code) => (era = code)}
			{showEvents}
			bind:filter
		/>
	{/if}
</AtelierLayout>

{#if !wide.current && !data.error && !data.empty}
	<TimelineFilterDialog
		artworks={eraArtworks}
		{era}
		{filtering}
		{matching}
		bind:open={dialogOpen}
		bind:filter
		bind:showEvents
	/>
{/if}

<Toast bind:this={toast} />
