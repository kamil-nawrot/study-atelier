<script lang="ts">
	import Pencil from '@lucide/svelte/icons/pencil';
	import Trash from '@lucide/svelte/icons/trash-2';
	import { onMount } from 'svelte';
	import { Alert, Button, Dialog, LoadFailure, Toast, Tooltip } from '@study-atelier/ui';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { deleteValue } from '#lib/card-index/card-index-data/card-index-data.ts';
	import { canDelete } from '#lib/card-index/card-index/card-index.ts';
	import ArtworksSection from '#lib/wall/components/ArtworksSection/ArtworksSection.svelte';
	import AtelierLayout from '#lib/shell/AtelierLayout/AtelierLayout.svelte';
	import ValueView from '#lib/values/components/ValueView/ValueView.svelte';
	import RelationsBand from '#lib/relations/components/RelationsBand/RelationsBand.svelte';
	import {
		artworksOfValue,
		subjectId,
		subjectName,
		subjectPath,
		valueEditPath,
		valueParents
	} from '#lib/card-index/value-pages/value-pages.ts';
	import { WallImages } from '#lib/wall/wall-images/wall-images.svelte.ts';
	import BackLink from '#lib/shared/navigation/BackLink/BackLink.svelte';
	import { m } from '#lib/i18n/i18n.ts';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const cardIndexPath = resolve('/(app)/atelier/values');

	let toast: Toast;
	let deleteOpen = $state(false);
	let deleting = $state(false);
	let deleteError = $state<string>();
	const images = new WallImages();

	let subject = $derived(data.subject);
	let title = $derived(
		subject
			? subjectName(subject)
			: data.notFound
				? m.valuePage.notFoundTitle
				: m.valuePage.loadErrorTitle
	);
	let editHref = $derived(subject ? valueEditPath(subject.kind, subjectId(subject)) : undefined);
	let artworks = $derived(subject ? images.apply(artworksOfValue(data.artworks, subject)) : []);
	let parents = $derived(subject ? valueParents(data.index, subject) : []);
	let record = $derived(subject && subject.kind !== 'era' ? subject.record : undefined);
	let kind = $derived(record ? m.cardIndex.kinds[record.category] : undefined);

	$effect.pre(() => {
		void data.artworks;
		images.reset();
	});

	onMount(() => {
		const message = page.state.valueMessage;
		if (message === undefined || !subject) return;
		toast.show(message);
		void goto(subjectPath(subject), { state: {}, shallow: true, replace: true });
	});

	function askToDelete(): void {
		deleteError = undefined;
		deleteOpen = true;
	}

	async function remove(): Promise<void> {
		if (!record || deleting) return;
		deleting = true;
		deleteError = undefined;
		const result = await deleteValue(record);
		deleting = false;
		if (result.error) {
			deleteError = result.error;
			return;
		}
		deleteOpen = false;
		await goto(cardIndexPath, {
			refreshAll: true,
			state: { valueMessage: m.cardIndex.deleted(record.name) }
		});
	}
</script>

<AtelierLayout email={data.session.user.email ?? ''} {title}>
	{#snippet bar()}
		<BackLink fallbackHref={cardIndexPath} fallbackName={m.valuePage.back} />
		{#if editHref}
			<Button aria-label={m.common.edit} compact href={editHref} icon={Pencil}>
				{m.common.edit}
			</Button>
		{/if}
		{#if record && kind}
			{#if canDelete(record)}
				<Button
					aria-label={m.common.delete}
					compact
					icon={Trash}
					onclick={askToDelete}
					variant="danger"
				>
					{m.common.delete}
				</Button>
			{:else}
				<Tooltip
					align="end"
					placement="bottom"
					text={m.valuePage.deleteBlocked(
						kind.demonstrative,
						m.atelier.count(record.count),
						kind.other
					)}
				>
					{#snippet children(describedby)}
						<Button
							aria-describedby={describedby}
							aria-disabled="true"
							aria-label={m.common.delete}
							compact
							icon={Trash}
							variant="danger"
						>
							{m.common.delete}
						</Button>
					{/snippet}
				</Tooltip>
			{/if}
		{/if}
	{/snippet}

	{#if subject && editHref}
		<div class="page">
			<ValueView
				{artworks}
				count={artworks.length}
				details={data.details}
				glossary={data.glossary}
				mentions={data.mentions}
				noteLinks={data.noteLinks}
				{parents}
				{subject}
				visits={data.visits}
			/>

			{#if data.relations}
				<RelationsBand relations={data.relations} />
			{/if}

			<ArtworksSection
				{artworks}
				empty={m.valuePage.kinds[subject.kind].noArtworks}
				{images}
				title={m.valuePage.kinds[subject.kind].artworks}
			/>
		</div>
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

<Toast bind:this={toast} />

{#snippet deleteErrorAlert()}
	<Alert tone="danger">
		{deleteError}
	</Alert>
{/snippet}

{#if record && kind}
	<Dialog
		children={deleteError ? deleteErrorAlert : undefined}
		description={m.cardIndex.deleteConfirm.description}
		size="small"
		title={m.cardIndex.deleteConfirm.title(kind.accusative, record.name)}
		bind:open={deleteOpen}
	>
		{#snippet footer()}
			<Button onclick={() => (deleteOpen = false)}>
				{m.common.back}
			</Button>
			<Button disabled={deleting} onclick={remove} variant="primary">
				{deleting ? m.common.deleting : m.common.delete}
			</Button>
		{/snippet}
	</Dialog>
{/if}

<style>
	.page {
		display: grid;
		gap: var(--spacing-6);
	}
</style>
