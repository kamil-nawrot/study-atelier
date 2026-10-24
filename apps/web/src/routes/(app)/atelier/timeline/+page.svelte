<script lang="ts">
	import Plus from '@lucide/svelte/icons/plus';
	import SlidersHorizontal from '@lucide/svelte/icons/sliders-horizontal';
	import { onMount, untrack } from 'svelte';
	import { MediaQuery } from 'svelte/reactivity';
	import { Alert, Button, Dialog, Icon, Toast, Tooltip } from '@study-atelier/ui';
	import { goto, invalidateAll } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import AtelierLayout from '#lib/shell/AtelierLayout/AtelierLayout.svelte';
	import FilterSidePanel from '#lib/wall/components/FilterSidePanel/FilterSidePanel.svelte';
	import { m } from '#lib/i18n/i18n.ts';
	import TimelineFilterPanel from '#lib/timeline/components/TimelineFilterPanel/TimelineFilterPanel.svelte';
	import TimelineView, {
		type TimelinePlace
	} from '#lib/timeline/components/TimelineView/TimelineView.svelte';
	import {
		applyTimelineFilter,
		artworksIn,
		emptyTimelineFilter,
		isEmptyTimelineFilter,
		timelineTags
	} from '#lib/timeline/filter/filter.ts';
	import { eraOfYear, rememberEra, rememberedEra, startEra } from '#lib/timeline/start/start.ts';
	import { entriesSpan, eraOf, spanOfYears } from '#lib/timeline/time/time.ts';
	import type { TimelineEvent, TimelineFilter } from '#lib/timeline/types.ts';
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
	let readingArtworks = $state(false);
	let panelOpen = $state(false);
	let timelineView = $state<TimelineView>();

	type Saved = {
		place?: TimelinePlace;
		filter: TimelineFilter;
		showEvents: boolean;
		readingArtworks: boolean;
	};

	export const snapshot: Snapshot<Saved> = {
		capture: () => ({ place: timelineView?.capture(), filter, showEvents, readingArtworks }),
		restore: (value) => {
			filter = value.filter;
			showEvents = value.showEvents;
			readingArtworks = value.readingArtworks;
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
	let filtersLabel = $derived(
		filtering
			? m.atelier.filters.buttonWithCount(timelineTags(filter).length)
			: m.atelier.filters.button
	);

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

<AtelierLayout email={data.session.user.email ?? ''} title={m.timeline.title}>
	{#snippet bar()}
		{#if !data.error}
			<div class="actions">
				<Tooltip align="end" placement="bottom" text={filtersLabel}>
					{#snippet children(id)}
						<Button
							aria-describedby={id}
							aria-expanded={wide.current ? panelOpen : undefined}
							aria-haspopup={wide.current ? undefined : 'dialog'}
							aria-label={filtersLabel}
							onclick={() => (wide.current ? (panelOpen = !panelOpen) : (dialogOpen = true))}
							variant={filtering ? 'primary' : 'secondary'}
						>
							<Icon icon={SlidersHorizontal} />
						</Button>
					{/snippet}
				</Tooltip>
				<Button href={resolve('/(app)/atelier/timeline/events/new')} variant="primary">
					<Icon icon={Plus} size="sm" />
					<span class="long">{m.timeline.add}</span>
					<span class="short">{m.timeline.addShort}</span>
				</Button>
			</div>
		{/if}
	{/snippet}

	{#snippet panel()}
		{#if wide.current && !data.error}
			<FilterSidePanel
				{filtering}
				onclear={() => (filter = emptyTimelineFilter())}
				summary={m.atelier.filteredCount(matching, eraArtworks.length)}
				bind:open={panelOpen}
			>
				<TimelineFilterPanel
					artworks={eraArtworks}
					{era}
					bind:filter
					bind:readingArtworks
					bind:showEvents
				/>
			</FilterSidePanel>
		{/if}
	{/snippet}

	<header>
		<h1>{m.timeline.title}</h1>
		<p class="lead">{m.timeline.lead}</p>
	</header>

	{#if data.error}
		<Alert title={m.timeline.loadErrorTitle} tone="danger">
			{data.error}
		</Alert>
	{:else}
		<TimelineView
			bind:this={timelineView}
			artworks={data.artworks}
			events={data.events}
			{initialEra}
			{initialFocus}
			ondeleted={removed}
			onerachange={(code) => (era = code)}
			{readingArtworks}
			{showEvents}
			bind:filter
		/>
	{/if}
</AtelierLayout>

{#if !wide.current && !data.error}
	<Dialog title={m.atelier.filters.title} bind:open={dialogOpen}>
		<TimelineFilterPanel
			artworks={eraArtworks}
			{era}
			bind:filter
			bind:readingArtworks
			bind:showEvents
		/>
		{#snippet footer()}
			<Button disabled={!filtering} onclick={() => (filter = emptyTimelineFilter())}>
				{m.atelier.filters.clear}
			</Button>
			<Button onclick={() => (dialogOpen = false)} variant="primary">
				{m.atelier.filters.showResults(matching)}
			</Button>
		{/snippet}
	</Dialog>
{/if}

<Toast bind:this={toast} />

<style>
	.actions {
		display: flex;
		gap: inherit;
		margin-inline-start: auto;
	}

	header {
		display: grid;
		gap: var(--spacing-2);
	}

	.short {
		display: inline;
	}

	.long {
		display: none;
	}

	@media (min-width: 768px) {
		.short {
			display: none;
		}

		.long {
			display: inline;
		}
	}
</style>
