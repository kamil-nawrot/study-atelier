<script lang="ts">
	import Pencil from '@lucide/svelte/icons/pencil';
	import { Button, LoadFailure } from '@study-atelier/ui';
	import { resolve } from '$app/paths';
	import { m } from '#lib/i18n/i18n.ts';
	import AtelierLayout from '#lib/shell/AtelierLayout/AtelierLayout.svelte';
	import BackLink from '#lib/shared/navigation/BackLink/BackLink.svelte';
	import OwnValueView from '#lib/card-index/components/OwnValueView/OwnValueView.svelte';
	import { ownFieldPath } from '#lib/card-index/own-field-pages/own-field-pages.ts';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const cardIndexPath = resolve('/(app)/atelier/values');

	let view = $state<OwnValueView>();

	let title = $derived(
		data.value?.name ??
			(data.notFound ? m.ownFields.page.notFoundTitle : m.valuePage.loadErrorTitle)
	);
</script>

<AtelierLayout email={data.session.user.email ?? ''} {title}>
	{#snippet bar()}
		<BackLink
			fallbackHref={data.field ? ownFieldPath(data.field.id) : cardIndexPath}
			fallbackName={data.field?.name ?? m.valuePage.back}
		/>
		{#if data.value}
			<Button aria-label={m.common.edit} compact icon={Pencil} onclick={() => view?.edit()}>
				{m.common.edit}
			</Button>
		{/if}
	{/snippet}

	{#if data.field && data.value}
		<OwnValueView bind:this={view} artworks={data.artworks} field={data.field} value={data.value} />
	{:else}
		<LoadFailure
			backHref={cardIndexPath}
			backLabel={m.valuePage.back}
			message={data.error ?? ''}
			notFound={data.notFound === true}
		/>
	{/if}
</AtelierLayout>
