<script lang="ts">
	import { resolve } from '$app/paths';
	import { m } from '#lib/i18n/i18n.ts';
	import EventFormPage from '#lib/timeline/components/EventFormPage/EventFormPage.svelte';
	import { eventPath } from '#lib/timeline/event-page/event-page.ts';
	import BackLink from '#lib/shared/navigation/BackLink/BackLink.svelte';
	import AtelierLayout from '#lib/shell/AtelierLayout/AtelierLayout.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const title = m.timeline.form.editTitle;

	let backPath = $derived(
		data.event ? eventPath(data.event.id) : resolve('/(app)/atelier/timeline')
	);

	let page = $state<EventFormPage>();
</script>

<AtelierLayout
	confirmLeave={() => page?.confirmLeave() ?? Promise.resolve(true)}
	email={data.session.user.email ?? ''}
	title={data.notFound ? m.timeline.form.notFoundTitle : title}
>
	{#snippet bar()}
		<BackLink fallbackHref={backPath} fallbackName={data.event?.name ?? m.timeline.title} />
		<h1 class="visually-hidden">{title}</h1>
	{/snippet}

	<EventFormPage bind:this={page} {data} />
</AtelierLayout>
