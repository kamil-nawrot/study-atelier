<script lang="ts">
	import Waypoints from '@lucide/svelte/icons/waypoints';
	import { Disclosure } from '@study-atelier/ui';
	import { resolve } from '$app/paths';
	import { m } from '#lib/i18n/i18n.ts';
	import { groupRelations } from '#lib/artwork-relations/relation-types/relation-types.ts';
	import type { ArtworkRelation } from '#lib/artwork-relations/types/artwork-relation.ts';

	type Props = {
		relations: readonly ArtworkRelation[];
	};

	let { relations }: Props = $props();

	let groups = $derived(groupRelations(relations));
</script>

{#if relations.length > 0}
	<Disclosure count={relations.length} icon={Waypoints} muted title={m.artworkRelations.title}>
		<div class="groups">
			{#each groups as group (group.type)}
				<section>
					<h3 class="caption">{group.label}</h3>
					<ul>
						{#each group.artworks as artwork (artwork.id)}
							<li>
								<a href={resolve('/(app)/atelier/[number]', { number: String(artwork.number) })}>
									<cite>{artwork.title}</cite>
								</a>
							</li>
						{/each}
					</ul>
				</section>
			{/each}
		</div>
	</Disclosure>
{/if}

<style>
	.groups {
		display: grid;
		gap: var(--spacing-4);
	}

	section {
		display: grid;
		gap: var(--spacing-1);
	}

	h3 {
		margin: 0;
		color: var(--color-fg-muted);
		font-weight: inherit;
	}

	ul {
		display: grid;
		justify-items: start;
		gap: var(--spacing-1);
		margin: 0;
		padding: 0;
		list-style: none;
	}

	a {
		color: var(--color-fg);
		font-family: var(--font-family-title), Georgia, serif;
	}
</style>
