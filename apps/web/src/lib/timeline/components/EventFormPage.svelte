<script lang="ts">
	import { LoadFailure } from '@study-atelier/ui';
	import { afterNavigate, goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { arrivedFromApp, goBackThroughHistory } from '#lib/shared/navigation/history/history.ts';
	import { m } from '#lib/i18n/index.ts';
	import type { TimelineEventDraft, TimelineEventResult } from '#lib/timeline/types.ts';
	import EventForm from './EventForm.svelte';

	type Props = {
		data: TimelineEventResult;
	};

	let { data }: Props = $props();

	const timelinePath = resolve('/(app)/atelier/timeline');

	let form = $state<EventForm>();
	let cameFromApp = false;
	let cameFromTimeline = false;

	let failed = $derived(data.error !== undefined || data.notFound === true);

	afterNavigate(({ from }) => {
		cameFromApp = arrivedFromApp(from);
		cameFromTimeline = from?.url?.pathname === timelinePath;
	});

	function goBack(event: MouseEvent): void {
		goBackThroughHistory(event, cameFromApp);
	}

	export function confirmLeave(): Promise<boolean> {
		return form?.confirmLeave() ?? Promise.resolve(true);
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
