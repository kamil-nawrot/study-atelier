<script lang="ts">
	import { resolve } from '$app/paths';
	import { m } from '#lib/i18n/index.ts';
	import EventFormPage from '#lib/timeline/components/EventFormPage.svelte';
	import BackLink from '#lib/shared/navigation/BackLink/BackLink.svelte';
	import AtelierLayout from '#lib/shell/AtelierLayout/AtelierLayout.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const title = m.timeline.form.editTitle;

	let page = $state<EventFormPage>();
</script>

<AtelierLayout
	confirmLeave={() => page?.confirmLeave() ?? Promise.resolve(true)}
	email={data.session.user.email ?? ''}
	title={data.notFound ? m.timeline.form.notFoundTitle : title}
>
	{#snippet bar()}
		<BackLink fallbackHref={resolve('/(app)/atelier/timeline')} fallbackName={m.timeline.title} />
		<h1 class="visually-hidden">{title}</h1>
	{/snippet}

	<EventFormPage bind:this={page} {data} />
</AtelierLayout>
