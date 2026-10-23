<script lang="ts">
	import { LoadFailure } from '@study-atelier/ui';
	import { afterNavigate, goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import AtelierLayout from '#lib/collection/components/AtelierLayout.svelte';
	import { goBackThroughHistory } from '#lib/collection/history.ts';
	import { m } from '#lib/i18n/index.ts';
	import BackLink from '#lib/navigation/components/BackLink.svelte';
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
	let cameFromTimeline = false;

	let failed = $derived(data.error !== undefined || data.notFound === true);

	afterNavigate(({ from }) => {
		cameFromApp = from !== null;
		cameFromTimeline = from?.url.pathname === timelinePath;
	});

	function goBack(event: MouseEvent): void {
		goBackThroughHistory(event, cameFromApp);
	}

	async function showSaved(draft: TimelineEventDraft): Promise<void> {
		if (draft.yearTo === null) return;
		const options = {
			replace: true,
			refreshAll: true,
			state: {
				timelineEvent: {
					message: m.timeline.saved(draft.name),
					yearFrom: draft.yearFrom,
					yearTo: draft.yearTo
				}
			}
		};
		if (!cameFromTimeline) {
			await goto(timelinePath, options);
			return;
		}
		addEventListener('popstate', () => void goto(timelinePath, options), { once: true });
		history.back();
	}
</script>

<AtelierLayout
	confirmLeave={() => form?.confirmLeave() ?? Promise.resolve(true)}
	{email}
	title={data.notFound ? m.timeline.form.notFoundTitle : title}
>
	{#snippet bar()}
		<BackLink fallbackHref={timelinePath} fallbackName={m.timeline.title} />
		<h1 class="visually-hidden">{title}</h1>
	{/snippet}

	{#if failed}
		<LoadFailure
			backHref={timelinePath}
			backLabel={m.timeline.title}
			errorTitle={m.timeline.form.loadErrorTitle}
			message={data.notFound ? m.timeline.errors.notFound : (data.error ?? '')}
			notFound={data.notFound === true}
		/>
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
