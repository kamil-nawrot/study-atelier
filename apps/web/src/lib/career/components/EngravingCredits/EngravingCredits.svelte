<script lang="ts">
	import ImageIcon from '@lucide/svelte/icons/image';
	import { Icon, PopupButton } from '@study-atelier/ui';
	import { m } from '#lib/i18n/i18n.ts';
	import { credits } from '#lib/career/exhibit-art/exhibit-art.ts';
	import { commonsFilePage } from '#lib/images/commons/commons.ts';

	type Props = {
		codes: string[];
	};

	let { codes }: Props = $props();

	let sources = $derived(credits(codes));
</script>

{#if sources.length > 0}
	<PopupButton align="end" label={m.career.credits} tooltip>
		{#snippet trigger()}
			<Icon icon={ImageIcon} size="sm" />
		{/snippet}
		<ul class="credits caption">
			{#each sources as art (art.file)}
				<li>
					<a href={commonsFilePage(art.commonsFile)} rel="external noreferrer" target="_blank"
						>{art.credit}</a
					>
					· {art.licence} · {m.career.recoloured}
				</li>
			{/each}
		</ul>
	</PopupButton>
{/if}

<style>
	.credits {
		display: grid;
		gap: var(--spacing-1);
		inline-size: min(var(--size-content-narrow), calc(100vw - var(--spacing-12)));
		padding: 0;
		list-style: none;
	}
</style>
