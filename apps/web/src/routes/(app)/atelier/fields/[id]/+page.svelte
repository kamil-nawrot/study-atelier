<script lang="ts">
	import Pencil from '@lucide/svelte/icons/pencil';
	import Trash from '@lucide/svelte/icons/trash-2';
	import { Button, LoadFailure } from '@study-atelier/ui';
	import { resolve } from '$app/paths';
	import { m } from '#lib/i18n/i18n.ts';
	import AtelierLayout from '#lib/shell/AtelierLayout/AtelierLayout.svelte';
	import BackLink from '#lib/shared/navigation/BackLink/BackLink.svelte';
	import OwnFieldView from '#lib/card-index/components/OwnFieldView/OwnFieldView.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const cardIndexPath = resolve('/(app)/atelier/values');

	let view = $state<OwnFieldView>();

	let title = $derived(
		data.field?.name ??
			(data.notFound ? m.ownFields.page.notFoundTitle : m.valuePage.loadErrorTitle)
	);
</script>

<AtelierLayout email={data.session.user.email ?? ''} {title}>
	{#snippet bar()}
		<BackLink fallbackHref={cardIndexPath} fallbackName={m.valuePage.back} />
		{#if data.field}
			<Button aria-label={m.common.edit} compact icon={Pencil} onclick={() => view?.edit()}>
				{m.common.edit}
			</Button>
			<Button
				aria-label={m.common.delete}
				compact
				icon={Trash}
				onclick={() => view?.askDelete()}
				variant="danger"
			>
				{m.common.delete}
			</Button>
		{/if}
	{/snippet}

	{#if data.field}
		<OwnFieldView bind:this={view} field={data.field} fields={data.fields} />
	{:else}
		<LoadFailure
			backHref={cardIndexPath}
			backLabel={m.valuePage.back}
			heading={title}
			message={data.error ?? ''}
			notFound={data.notFound === true}
		/>
	{/if}
</AtelierLayout>
