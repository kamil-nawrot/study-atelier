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
	<footer class="footer">
		<PopupButton align="end" bare label={m.career.credits} placement="top">
			{#snippet trigger()}
				<span class="mark"><Icon icon={ImageIcon} size="sm" /></span>
			{/snippet}
			<ul class="credits caption">
				{#each sources as art (art.commonsFile)}
					<li>
						<a href={commonsFilePage(art.commonsFile)} rel="external noreferrer" target="_blank"
							>{art.credit}</a
						>
						· {art.licence} · {m.career.recoloured}
					</li>
				{/each}
			</ul>
		</PopupButton>
	</footer>
{/if}

<style>
	.footer {
		position: relative;
		display: flex;
		justify-content: flex-end;
		padding-block-start: var(--spacing-3);
		border-block-start: var(--border-width-hairline) solid var(--color-line);
	}

	.mark {
		display: flex;
		color: var(--color-fg-muted);
		opacity: 0.6;
	}

	.mark:hover,
	.footer:focus-within .mark {
		opacity: 1;
	}

	.credits {
		display: grid;
		gap: var(--spacing-1);
		inline-size: min(var(--size-content-narrow), calc(100vw - var(--spacing-16)));
		padding: 0;
		list-style: none;
	}
</style>
