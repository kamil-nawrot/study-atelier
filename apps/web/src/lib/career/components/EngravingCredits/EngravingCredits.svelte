<script lang="ts">
	import ImageIcon from '@lucide/svelte/icons/image';
	import { Icon, PopupButton } from '@study-atelier/ui';
	import { m } from '#lib/i18n/i18n.ts';
	import { credits, pageOf } from '#lib/career/exhibit-art/exhibit-art.ts';

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
			<div class="scroll">
				<ul class="credits caption">
					{#each sources as art (art.credit)}
						<li>
							<a href={pageOf(art)} rel="external noreferrer" target="_blank">{art.credit}</a>
							· {art.licence} · {m.career.recoloured}
						</li>
					{/each}
				</ul>
			</div>
		</PopupButton>
	</footer>
{/if}

<style>
	.footer {
		position: relative;
		display: flex;
		justify-content: flex-end;
		padding-block-start: var(--spacing-3);
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

	.scroll {
		inline-size: min(var(--size-content-default), calc(100vw - var(--spacing-16)));
		max-block-size: 70vh;
		overflow-y: auto;
	}

	.credits {
		column-gap: var(--spacing-6);
		list-style: none;
	}

	.credits li {
		padding-block-end: var(--spacing-1);
		break-inside: avoid;
	}

	@media (min-width: 768px) {
		.credits {
			columns: 2;
		}
	}
</style>
