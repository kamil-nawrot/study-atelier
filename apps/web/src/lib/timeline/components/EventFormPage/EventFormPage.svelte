<script lang="ts">
	import { LoadFailure } from '@study-atelier/ui';
	import { afterNavigate, goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import type { ResolvedPathname } from '$app/types';
	import { arrivedFromApp, goBackThroughHistory } from '#lib/shared/navigation/history/history.ts';
	import { m } from '#lib/i18n/i18n.ts';
	import type { TimelineEventDraft } from '#lib/timeline/types/timeline-event-draft.ts';
	import type { TimelineEventResult } from '#lib/timeline/types/timeline-event-result.ts';
	import EventForm from '#lib/timeline/components/EventForm/EventForm.svelte';
	import { eventPath } from '#lib/timeline/event-page/event-page.ts';

	type Props = {
		data: TimelineEventResult;
	};

	let { data }: Props = $props();

	const timelinePath = resolve('/(app)/atelier/timeline');
	const cardIndexPath = resolve('/(app)/atelier/values');

	let form = $state<EventForm>();
	let cameFromApp = false;
	let cameFromTimeline = false;
	let returnPath: ResolvedPathname | undefined;

	let failed = $derived(data.error !== undefined || data.notFound === true);

	afterNavigate(({ from }) => {
		cameFromApp = arrivedFromApp(from);
		cameFromTimeline = from?.url?.pathname === timelinePath;
		returnPath = valuePagePath(from?.url?.pathname);
	});

	function valuePagePath(pathname: string | undefined): ResolvedPathname | undefined {
		const eventPage = data.event ? eventPath(data.event.id) : undefined;
		return [cardIndexPath, eventPage].find((path) => path !== undefined && path === pathname);
	}

	function goBack(event: MouseEvent): void {
		goBackThroughHistory(event, cameFromApp);
	}

	export function confirmLeave(): Promise<boolean> {
		return form?.confirmLeave() ?? Promise.resolve(true);
	}

	async function returnTo(path: ResolvedPathname, draft: TimelineEventDraft): Promise<void> {
		const options = {
			replace: true,
			refreshAll: true,
			state: { valueMessage: m.timeline.saved(draft.name) }
		};
		addEventListener('popstate', () => void goto(path, options), { once: true });
		history.back();
	}

	async function showSaved(draft: TimelineEventDraft): Promise<void> {
		if (draft.yearTo === null) return;
		if (returnPath !== undefined) {
			await returnTo(returnPath, draft);
			return;
		}
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
		cancelHref={data.event ? eventPath(data.event.id) : timelinePath}
		event={data.event}
		oncancel={goBack}
		onsaved={showSaved}
	/>
{/if}
