<script lang="ts">
	import { resolve } from '$app/paths';
	import { m } from '#lib/i18n/i18n.ts';
	import VisitFormPage from '#lib/chronicle/components/VisitFormPage/VisitFormPage.svelte';
	import BackLink from '#lib/shared/navigation/BackLink/BackLink.svelte';
	import AtelierLayout from '#lib/shell/AtelierLayout/AtelierLayout.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	let title = $derived(
		data.visit?.kind === 'trip' ? m.chronicle.trip.form.editTitle : m.chronicle.form.editTitle
	);

	let backPath = $derived(
		data.visit
			? resolve('/(app)/atelier/chronicle/[id]', { id: data.visit.id })
			: resolve('/(app)/atelier/chronicle')
	);

	let page = $state<VisitFormPage>();
</script>

<AtelierLayout
	confirmLeave={() => page?.confirmLeave() ?? Promise.resolve(true)}
	email={data.session.user.email ?? ''}
	title={data.notFound ? m.chronicle.form.notFoundTitle : title}
>
	{#snippet bar()}
		<BackLink fallbackHref={backPath} fallbackName={data.visit?.place ?? m.chronicle.back} />
		<h1 class="visually-hidden">{title}</h1>
	{/snippet}

	<VisitFormPage bind:this={page} {data} />
</AtelierLayout>
