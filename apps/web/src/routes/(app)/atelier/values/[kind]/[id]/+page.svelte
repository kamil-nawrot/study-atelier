<script lang="ts">
	import ArrowLeft from '@lucide/svelte/icons/arrow-left';
	import Pencil from '@lucide/svelte/icons/pencil';
	import Trash from '@lucide/svelte/icons/trash-2';
	import { onMount } from 'svelte';
	import { Alert, Button, Dialog, Icon, Section, Toast, Tooltip } from '@study-atelier/ui';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { deleteValue } from '#lib/collection/card-index-data.ts';
	import { canDelete } from '#lib/collection/card-index.ts';
	import ArtworkWall from '#lib/collection/components/ArtworkWall.svelte';
	import AtelierLayout from '#lib/collection/components/AtelierLayout.svelte';
	import ValueView from '#lib/collection/components/ValueView.svelte';
	import {
		artworksOfValue,
		subjectId,
		subjectName,
		subjectPath,
		valueEditPath,
		valueParents
	} from '#lib/collection/value-pages.ts';
	import { WallImages } from '#lib/collection/wall-images.svelte.ts';
	import { m } from '#lib/i18n/index.ts';
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
		<a class="back" href={cardIndexPath}>
			<Icon icon={ArrowLeft} />
			{m.valuePage.back}
		</a>
		{#if editHref}
			<Button aria-label={m.valuePage.edit} href={editHref}>
				<Icon icon={Pencil} size="sm" />
				<span class="label">
					{m.valuePage.edit}
				</span>
			</Button>
		{/if}
		{#if record && kind}
			{#if canDelete(record)}
				<Button aria-label={m.valuePage.delete} onclick={askToDelete} variant="danger">
					<Icon icon={Trash} size="sm" />
					<span class="label">
						{m.valuePage.delete}
					</span>
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
							aria-label={m.valuePage.delete}
							variant="danger"
						>
							<Icon icon={Trash} size="sm" />
							<span class="label">
								{m.valuePage.delete}
							</span>
						</Button>
					{/snippet}
				</Tooltip>
			{/if}
		{/if}
	{/snippet}

	{#if subject && editHref}
		<ValueView
			count={artworks.length}
			details={data.details}
			glossary={data.glossary}
			mentions={data.mentions}
			noteLinks={data.noteLinks}
			{parents}
			{subject}
		/>

		<section class="artworks" aria-labelledby="value-artworks">
			<header>
				<h2 id="value-artworks">{m.valuePage.kinds[subject.kind].artworks}</h2>
				<span class="count">{m.atelier.count(artworks.length)}</span>
			</header>
			{#if artworks.length === 0}
				<p class="empty">{m.valuePage.kinds[subject.kind].noArtworks}</p>
			{:else}
				<ArtworkWall
					{artworks}
					onimagefailed={(artwork) => images.failed(artwork)}
					onnearscreen={(artwork) => images.request(artwork)}
				/>
			{/if}
		</section>
	{:else}
		<Section>
			{#if data.notFound}
				<p class="lead">{data.error}</p>
			{:else}
				<Alert tone="danger">
					{data.error}
				</Alert>
			{/if}
		</Section>
		<div>
			<Button href={cardIndexPath}>
				{m.valuePage.back}
			</Button>
		</div>
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
				{m.cardIndex.deleteConfirm.back}
			</Button>
			<Button disabled={deleting} onclick={remove} variant="primary">
				{deleting ? m.cardIndex.deleteConfirm.deleting : m.cardIndex.deleteConfirm.confirm}
			</Button>
		{/snippet}
	</Dialog>
{/if}

<style>
	.back {
		display: flex;
		flex: 1;
		align-items: center;
		gap: var(--spacing-2);
		color: var(--color-fg);
		font-size: var(--font-size-sm);
		font-weight: var(--font-weight-medium);
		text-decoration: none;
	}

	.label {
		display: none;
	}

	.artworks {
		display: grid;
		gap: var(--spacing-6);
		margin-top: var(--spacing-6);
		padding-top: var(--spacing-6);
		border-top: var(--border-width-hairline) solid var(--color-line);
	}

	.artworks header {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		gap: var(--spacing-4);
	}

	h2 {
		font-size: var(--font-size-lg);
		font-weight: var(--font-weight-bold);
		line-height: var(--line-height-lg);
	}

	.count,
	.empty {
		color: var(--color-fg-muted);
		font-size: var(--font-size-sm);
	}

	@media (min-width: 768px) {
		.label {
			display: inline;
		}
	}
</style>
