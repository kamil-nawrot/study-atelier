<script lang="ts">
	import Plus from '@lucide/svelte/icons/plus';
	import { onMount, untrack } from 'svelte';
	import { Alert, Button, Icon, Toast } from '@study-atelier/ui';
	import { goto, invalidateAll } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import AtelierBackLink from '#lib/collection/components/AtelierBackLink.svelte';
	import AtelierLayout from '#lib/collection/components/AtelierLayout.svelte';
	import { m } from '#lib/i18n/index.ts';
	import TimelineView from '#lib/timeline/components/TimelineView.svelte';
	import { eraOfYear, rememberEra, rememberedEra, startEra } from '#lib/timeline/start.ts';
	import { spanOfYears } from '#lib/timeline/time.ts';
	import type { TimelineEvent } from '#lib/timeline/types.ts';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const timelinePath = resolve('/(app)/atelier/timeline');
	const saved = untrack(() => page.state.timelineEvent);
	const initialEra = untrack(() =>
		saved ? eraOfYear(saved.yearTo) : startEra(data.artworks, rememberedEra())
	);
	const initialFocus = saved ? spanOfYears(saved.yearFrom, saved.yearTo) : undefined;

	let toast: Toast;

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
		<AtelierBackLink />
		{#if !data.error}
			<Button href={resolve('/(app)/atelier/timeline/events/new')} variant="primary">
				<Icon icon={Plus} size="sm" />
				<span class="long">{m.timeline.add}</span>
				<span class="short">{m.timeline.addShort}</span>
			</Button>
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
			artworks={data.artworks}
			events={data.events}
			{initialEra}
			{initialFocus}
			ondeleted={removed}
		/>
	{/if}
</AtelierLayout>

<Toast bind:this={toast} />

<style>
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
