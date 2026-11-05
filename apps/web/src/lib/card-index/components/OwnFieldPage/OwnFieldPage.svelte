<script lang="ts">
	import Pencil from '@lucide/svelte/icons/pencil';
	import Plus from '@lucide/svelte/icons/plus';
	import Trash from '@lucide/svelte/icons/trash-2';
	import { Button, Dialog, Icon, LoadFailure, Toast } from '@study-atelier/ui';
	import { goto, invalidateAll } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { m } from '#lib/i18n/i18n.ts';
	import AtelierLayout from '#lib/shell/AtelierLayout/AtelierLayout.svelte';
	import BackLink from '#lib/shared/navigation/BackLink/BackLink.svelte';
	import CardIndexList from '#lib/card-index/components/CardIndexList/CardIndexList.svelte';
	import NewOwnValueDialog from '#lib/card-index/components/NewOwnValueDialog/NewOwnValueDialog.svelte';
	import OwnFieldDialog from '#lib/card-index/components/OwnFieldDialog/OwnFieldDialog.svelte';
	import OwnFieldHeader from '#lib/card-index/components/OwnFieldHeader/OwnFieldHeader.svelte';
	import { deleteOwnField } from '#lib/card-index/own-fields-data/own-fields-data.ts';
	import { ownValuePath } from '#lib/card-index/own-field-pages/own-field-pages.ts';
	import {
		rememberSort,
		rememberedSort,
		sortsOf
	} from '#lib/card-index/card-index-sort/card-index-sort.ts';
	import type { OwnFieldPageData } from '#lib/card-index/own-field-pages/own-field-pages.ts';

	type Props = {
		email: string;
		data: OwnFieldPageData;
	};

	let { email, data }: Props = $props();

	const cardIndexPath = resolve('/(app)/atelier/values');

	let toast: Toast;
	let editOpen = $state(false);
	let valueOpen = $state(false);
	let deleteOpen = $state(false);
	let deleting = $state(false);
	let failure = $state<string>();
	let query = $state('');
	let sort = $state(rememberedSort('own'));

	let field = $derived(data.field);
	let title = $derived(
		field?.name ?? (data.notFound ? m.ownFields.page.notFoundTitle : m.valuePage.loadErrorTitle)
	);

	async function changed(message: string): Promise<void> {
		await invalidateAll();
		toast.show(message);
	}

	async function remove(): Promise<void> {
		if (!field || deleting) return;
		deleting = true;
		failure = undefined;
		const { error } = await deleteOwnField(field);
		deleting = false;
		if (error) {
			failure = error;
			return;
		}
		deleteOpen = false;
		await goto(cardIndexPath, {
			refreshAll: true,
			state: { valueMessage: m.ownFields.deleted(field.name) }
		});
	}
</script>

<AtelierLayout {email} {title}>
	{#snippet bar()}
		<BackLink fallbackHref={cardIndexPath} fallbackName={m.valuePage.back} />
		{#if field}
			<Button aria-label={m.common.edit} compact icon={Pencil} onclick={() => (editOpen = true)}>
				{m.common.edit}
			</Button>
			<Button
				aria-label={m.common.delete}
				compact
				icon={Trash}
				onclick={() => (deleteOpen = true)}
				variant="danger"
			>
				{m.common.delete}
			</Button>
		{/if}
	{/snippet}

	{#if field}
		<div class="page">
			<OwnFieldHeader {failure} {field} />

			<section class="values" aria-labelledby="field-values">
				<header>
					<h2 id="field-values">{m.ownFields.values}</h2>
					{#if field.kind === 'list'}
						<span class="count">{m.ownFields.page.valueCount(field.values.length)}</span>
					{/if}
				</header>
				{#if field.kind === 'list'}
					{#snippet addValue()}
						<Button onclick={() => (valueOpen = true)} variant="primary">
							<Icon icon={Plus} />
							{m.ownFields.addValue}
						</Button>
					{/snippet}
					<CardIndexList
						actions={addValue}
						empty={m.ownFields.noValues}
						href={(id) => ownValuePath(field.id, id)}
						records={field.values}
						searchLabel={m.ownFields.search(field.name)}
						sorts={sortsOf('own')}
						bind:query
						bind:sort={() => sort, (value) => rememberSort('own', (sort = value))}
					/>
				{:else}
					<p class="empty">{m.ownFields.page.noList}</p>
				{/if}
			</section>
		</div>
	{:else}
		<LoadFailure
			backHref={cardIndexPath}
			backLabel={m.valuePage.back}
			message={data.error ?? ''}
			notFound={data.notFound === true}
		/>
	{/if}
</AtelierLayout>

<Toast bind:this={toast} />

{#if field}
	<OwnFieldDialog edited={field} fields={data.fields} onsaved={changed} bind:open={editOpen} />
	<NewOwnValueDialog {field} onsaved={changed} bind:open={valueOpen} />
	<Dialog
		description={m.ownFields.deleteConfirm.description(field.count)}
		size="small"
		title={m.ownFields.deleteConfirm.title(field.name)}
		bind:open={deleteOpen}
	>
		{#snippet footer()}
			<Button onclick={() => (deleteOpen = false)}>
				{m.common.back}
			</Button>
			<Button disabled={deleting} onclick={remove} variant="primary">
				{deleting ? m.common.deleting : m.ownFields.deleteConfirm.confirm}
			</Button>
		{/snippet}
	</Dialog>
{/if}

<style>
	.page {
		display: grid;
		gap: var(--spacing-8);
	}

	.values {
		display: grid;
		gap: var(--spacing-6);
		padding-top: var(--spacing-6);
		border-top: var(--border-width-hairline) solid var(--color-line);
	}

	.values header {
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
</style>
