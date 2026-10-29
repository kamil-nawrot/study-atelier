<script lang="ts">
	import { resolve } from '$app/paths';
	import { m } from '#lib/i18n/i18n.ts';
	import VisitFormPage from '#lib/chronicle/components/VisitFormPage/VisitFormPage.svelte';
	import BackLink from '#lib/shared/navigation/BackLink/BackLink.svelte';
	import AtelierLayout from '#lib/shell/AtelierLayout/AtelierLayout.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const title = m.chronicle.form.newTitle;

	let page = $state<VisitFormPage>();
</script>

<AtelierLayout
	confirmLeave={() => page?.confirmLeave() ?? Promise.resolve(true)}
	email={data.session.user.email ?? ''}
	{title}
>
	{#snippet bar()}
		<BackLink fallbackHref={resolve('/(app)/atelier/chronicle')} fallbackName={m.chronicle.back} />
		<h1 class="visually-hidden">{title}</h1>
	{/snippet}

	<VisitFormPage bind:this={page} {data} />
</AtelierLayout>
