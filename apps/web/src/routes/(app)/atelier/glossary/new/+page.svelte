<script lang="ts">
	import { resolve } from '$app/paths';
	import { m } from '#lib/i18n/i18n.ts';
	import GlossaryFormPage from '#lib/glossary/components/GlossaryFormPage/GlossaryFormPage.svelte';
	import BackLink from '#lib/shared/navigation/BackLink/BackLink.svelte';
	import AtelierLayout from '#lib/shell/AtelierLayout/AtelierLayout.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const title = m.glossary.form.newTitle;

	const backPath = resolve('/(app)/atelier/glossary');

	let page = $state<GlossaryFormPage>();
</script>

<AtelierLayout
	confirmLeave={() => page?.confirmLeave() ?? Promise.resolve(true)}
	email={data.session.user.email ?? ''}
	title={data.notFound ? m.glossary.view.notFoundTitle : title}
>
	{#snippet bar()}
		<BackLink fallbackHref={backPath} fallbackName={data.entry?.name ?? m.glossary.back} />
		<h1 class="visually-hidden">{title}</h1>
	{/snippet}

	<GlossaryFormPage bind:this={page} {backPath} {data} />
</AtelierLayout>
