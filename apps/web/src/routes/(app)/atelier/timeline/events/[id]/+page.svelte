<script lang="ts">
	import MoreActions from '#lib/shared/navigation/MoreActions/MoreActions.svelte';
	import Pencil from '@lucide/svelte/icons/pencil';
	import Trash from '@lucide/svelte/icons/trash-2';
	import { Button, LoadFailure } from '@study-atelier/ui';
	import { resolve } from '$app/paths';
	import { m } from '#lib/i18n/i18n.ts';
	import AtelierLayout from '#lib/shell/AtelierLayout/AtelierLayout.svelte';
	import BackLink from '#lib/shared/navigation/BackLink/BackLink.svelte';
	import EventView from '#lib/timeline/components/EventView/EventView.svelte';
	import { eventEditPath } from '#lib/timeline/event-page/event-page.ts';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const timelinePath = resolve('/(app)/atelier/timeline');

	let view = $state<EventView>();

	let title = $derived(
		data.event?.name ??
			(data.notFound ? m.timeline.form.notFoundTitle : m.timeline.form.loadErrorTitle)
	);
</script>

<AtelierLayout email={data.session.user.email ?? ''} {title}>
	{#snippet bar()}
		<BackLink fallbackHref={timelinePath} fallbackName={m.timeline.title} />
		{#if data.event}
			<Button aria-label={m.common.edit} compact href={eventEditPath(data.event.id)} icon={Pencil}>
				{m.common.edit}
			</Button>
			<MoreActions
				actions={[
					{ label: m.common.delete, icon: Trash, onclick: () => view?.askDelete(), danger: true }
				]}
			>
				<Button
					aria-label={m.common.delete}
					compact
					icon={Trash}
					onclick={() => view?.askDelete()}
					variant="danger"
				>
					{m.common.delete}
				</Button>
			</MoreActions>
		{/if}
	{/snippet}

	{#if data.event}
		<EventView
			bind:this={view}
			artworks={data.artworks}
			event={data.event}
			relations={data.relations}
		/>
	{:else}
		<LoadFailure
			backHref={timelinePath}
			backLabel={m.timeline.title}
			heading={title}
			message={data.notFound ? m.timeline.errors.notFound : (data.error ?? '')}
			notFound={data.notFound === true}
		/>
	{/if}
</AtelierLayout>
