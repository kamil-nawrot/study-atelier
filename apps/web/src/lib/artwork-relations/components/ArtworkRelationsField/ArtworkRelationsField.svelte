<script lang="ts">
	import Plus from '@lucide/svelte/icons/plus';
	import X from '@lucide/svelte/icons/x';
	import { tick } from 'svelte';
	import { FieldMessage, Icon, IconButton, Select, TextButton } from '@study-atelier/ui';
	import { m } from '#lib/i18n/i18n.ts';
	import {
		isArtworkRelationType,
		relationTypeOptions
	} from '#lib/artwork-relations/relation-types/relation-types.ts';
	import { emptyRelationRow } from '#lib/artwork-relations/relation-rows/relation-rows.ts';
	import RelatedArtworkSearch from '#lib/artwork-relations/components/RelatedArtworkSearch/RelatedArtworkSearch.svelte';
	import type { ArtworkRelationRow } from '#lib/artwork-relations/types/artwork-relation-row.ts';

	type Props = {
		artworkId?: string;
		rows: ArtworkRelationRow[];
		error?: string;
	};

	let { artworkId, rows = $bindable(), error }: Props = $props();

	const fieldId = $props.id();
	const options = relationTypeOptions();

	let excluded = $derived(
		new Set([
			...(artworkId ? [artworkId] : []),
			...rows.flatMap((row) => (row.artwork ? [row.artwork.id] : []))
		])
	);

	async function add(): Promise<void> {
		const row = emptyRelationRow();
		rows = [...rows, row];
		await tick();
		document.getElementById(`${fieldId}-${row.key}-type`)?.focus();
	}

	function remove(key: string): void {
		rows = rows.filter((row) => row.key !== key);
	}

	function choose(row: ArtworkRelationRow, value: string): void {
		row.type = isArtworkRelationType(value) ? value : '';
	}
</script>

{#snippet addButton()}
	<div class="add">
		<TextButton inline onclick={add}>
			<Icon icon={Plus} size="sm" />
			{m.artworkRelations.add}
		</TextButton>
	</div>
{/snippet}

{#if rows.length === 0}
	{@render addButton()}
{:else}
	<fieldset class="field" aria-describedby={error ? `${fieldId}-message` : undefined}>
		<legend>{m.artworkRelations.title}</legend>
		<ul class="rows">
			{#each rows as row (row.key)}
				<li class="row">
					<Select
						id="{fieldId}-{row.key}-type"
						aria-invalid={error && row.type === '' && row.artwork ? true : undefined}
						compact
						hideLabel
						label={m.artworkRelations.type}
						onchange={(event) => choose(row, event.currentTarget.value)}
						{options}
						placeholder={m.artworkRelations.choose}
						placeholderUntilChosen
						value={row.type}
					/>
					<RelatedArtworkSearch
						{excluded}
						invalid={!!error && row.artwork === null && row.type !== ''}
						bind:artwork={row.artwork}
					/>
					<IconButton
						icon={X}
						label={row.artwork
							? m.artworkRelations.remove(row.artwork.title)
							: m.artworkRelations.removeEmpty}
						onclick={() => remove(row.key)}
						tone="danger"
						variant="plain"
					/>
				</li>
			{/each}
		</ul>
		{#if error}
			<FieldMessage id="{fieldId}-message" {error} live />
		{/if}
		{@render addButton()}
	</fieldset>
{/if}

<style>
	.add {
		display: flex;
	}

	.add :global(.text-button) {
		display: inline-flex;
		align-items: center;
		gap: var(--spacing-1);
	}

	.field {
		display: grid;
		gap: var(--spacing-3);
		min-width: 0;
		margin: 0;
		padding: 0;
		border: 0;
	}

	legend {
		padding: 0 0 var(--spacing-2);
		font-size: var(--font-size-sm);
		font-weight: var(--font-weight-medium);
		line-height: var(--line-height-sm);
	}

	.rows {
		display: grid;
		gap: var(--spacing-3);
		margin: 0;
		padding: 0;
		list-style: none;
	}

	.row {
		display: grid;
		grid-template-columns: 17rem minmax(0, 1fr) auto;
		gap: var(--spacing-3);
		align-items: start;
	}

	@media (max-width: 767.98px) {
		.row {
			grid-template-columns: minmax(0, 1fr) auto;
		}

		.row > :global(:nth-child(2)) {
			grid-row: 2;
			grid-column: 1 / -1;
		}
	}
</style>
