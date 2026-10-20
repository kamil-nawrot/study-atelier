<script lang="ts">
	import ArrowLeft from '@lucide/svelte/icons/arrow-left';
	import { Alert, Button, Icon, Section } from '@study-atelier/ui';
	import { afterNavigate, goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import AtelierLayout from '#lib/collection/components/AtelierLayout.svelte';
	import { goBackThroughHistory } from '#lib/collection/history.ts';
	import { m } from '#lib/i18n/index.ts';
	import type { TimelineEventDraft, TimelineEventResult } from '../types.ts';
	import EventForm from './EventForm.svelte';

	type Props = {
		email: string;
		data: TimelineEventResult;
		title: string;
	};

	let { email, data, title }: Props = $props();

	const timelinePath = resolve('/(app)/atelier/timeline');

	let form = $state<EventForm>();
	let cameFromApp = false;

	let failed = $derived(data.error !== undefined || data.notFound === true);

	afterNavigate(({ from }) => {
		cameFromApp = from !== null;
	});

	function goBack(event: MouseEvent): void {
		goBackThroughHistory(event, cameFromApp);
	}

	async function showSaved(draft: TimelineEventDraft): Promise<void> {
		if (draft.yearTo === null) return;
		await goto(timelinePath, {
			replace: true,
			refreshAll: true,
			state: {
				timelineEvent: {
					message: m.timeline.saved(draft.name),
					yearFrom: draft.yearFrom,
					yearTo: draft.yearTo
				}
			}
		});
	}
</script>

<AtelierLayout
	confirmLeave={() => form?.confirmLeave() ?? Promise.resolve(true)}
	{email}
	title={data.notFound ? m.timeline.form.notFoundTitle : title}
>
	{#snippet bar()}
		<div class="heading">
			<a class="back" aria-label={m.timeline.form.goBack} href={timelinePath} onclick={goBack}>
				<Icon icon={ArrowLeft} />
			</a>
			<h1>{title}</h1>
		</div>
	{/snippet}

	{#if failed}
		<Section>
			{#if data.notFound}
				<p class="lead">{m.timeline.errors.notFound}</p>
			{:else}
				<Alert title={m.timeline.form.loadErrorTitle} tone="danger">
					{data.error}
				</Alert>
			{/if}
		</Section>
		<div>
			<Button href={timelinePath}>
				{m.timeline.title}
			</Button>
		</div>
	{:else}
		<EventForm
			bind:this={form}
			cancelHref={timelinePath}
			event={data.event}
			oncancel={goBack}
			onsaved={showSaved}
		/>
	{/if}
</AtelierLayout>

<style>
	.heading {
		display: flex;
		align-items: center;
		gap: var(--spacing-2);
		min-width: 0;
	}

	.back {
		display: grid;
		place-items: center;
		flex: none;
		padding-block: var(--spacing-2);
		color: var(--color-fg);
	}

	h1 {
		font-size: var(--font-size-sm);
		font-weight: var(--font-weight-medium);
		line-height: var(--line-height-sm);
	}
</style>
