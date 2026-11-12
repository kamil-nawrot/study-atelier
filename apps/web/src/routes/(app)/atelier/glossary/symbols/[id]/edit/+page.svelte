<script lang="ts">
	import { resolve } from '$app/paths';
	import { m } from '#lib/i18n/i18n.ts';
	import BackLink from '#lib/shared/navigation/BackLink/BackLink.svelte';
	import AtelierLayout from '#lib/shell/AtelierLayout/AtelierLayout.svelte';
	import SymbolFormPage from '#lib/symbols/components/SymbolFormPage/SymbolFormPage.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const title = m.symbols.form.editTitle;

	let backPath = $derived(
		data.symbol
			? resolve('/(app)/atelier/glossary/symbols/[id]', { id: data.symbol.id })
			: resolve('/(app)/atelier/glossary')
	);

	let page = $state<SymbolFormPage>();
</script>

<AtelierLayout
	confirmLeave={() => page?.confirmLeave() ?? Promise.resolve(true)}
	email={data.session.user.email ?? ''}
	title={data.notFound ? m.symbols.view.notFoundTitle : title}
>
	{#snippet bar()}
		<BackLink fallbackHref={backPath} fallbackName={data.symbol?.name ?? m.glossary.back} />
		<h1 class="visually-hidden">{title}</h1>
	{/snippet}

	<SymbolFormPage bind:this={page} {backPath} {data} />
</AtelierLayout>
