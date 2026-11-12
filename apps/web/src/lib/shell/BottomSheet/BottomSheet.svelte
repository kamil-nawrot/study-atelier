<script lang="ts">
	import X from '@lucide/svelte/icons/x';
	import type { Snippet } from 'svelte';
	import { Icon, overlayScrollbar } from '@study-atelier/ui';

	type Props = {
		label: string;
		closeLabel: string;
		top?: Snippet;
		children: Snippet;
	};

	let { label, closeLabel, top, children }: Props = $props();

	let sheet: HTMLDialogElement;
	let used = $state(false);

	export function open(): void {
		used = true;
		sheet.showModal();
	}

	export function close(): void {
		if (sheet.open) sheet.close();
	}

	function outside(event: MouseEvent): boolean {
		const box = sheet.getBoundingClientRect();
		return (
			event.clientX < box.left ||
			event.clientX > box.right ||
			event.clientY < box.top ||
			event.clientY > box.bottom
		);
	}

	function closeOnLink(event: MouseEvent): void {
		const target = event.target as Element;
		if ((target === sheet && outside(event)) || target.closest('a')) sheet.close();
	}
</script>

<dialog bind:this={sheet} class="sheet" aria-label={label} onclick={closeOnLink}>
	{#if used}
		<div class="sheet-top">
			{@render top?.()}
			<button class="close" aria-label={closeLabel} onclick={() => sheet.close()} type="button">
				<Icon icon={X} />
			</button>
		</div>
		<div class="sheet-body" {@attach overlayScrollbar()}>
			{@render children()}
		</div>
	{/if}
</dialog>

<style>
	.sheet {
		inset: auto 0 0;
		width: 100%;
		max-width: none;
		height: auto;
		max-height: calc(100dvh - var(--spacing-12));
		margin: 0;
		padding: var(--spacing-3) var(--spacing-4) calc(var(--spacing-4) + env(safe-area-inset-bottom));
		border: none;
		border-top: var(--border-width-base) solid var(--color-line);
		background: var(--color-bg);
		color: var(--color-fg);
	}

	.sheet[open] {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-3);
	}

	.sheet::backdrop {
		background: var(--color-scrim);
	}

	@supports (backdrop-filter: blur(1px)) {
		.sheet::backdrop {
			backdrop-filter: blur(var(--blur-scrim));
		}
	}

	:global(html:has(.sheet[open])) {
		overflow: hidden;
	}

	.sheet-top {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--spacing-3);
		min-height: var(--size-control);
	}

	.close {
		display: grid;
		flex: none;
		place-items: center;
		width: var(--size-control);
		height: var(--size-control);
		margin-left: auto;
		padding: 0;
		border: none;
		background: transparent;
		color: var(--color-fg);
		cursor: pointer;
	}

	.sheet-body {
		min-height: 0;
		overflow-y: auto;
	}

	@media (prefers-reduced-motion: no-preference) {
		.sheet,
		.sheet::backdrop {
			transition:
				translate var(--duration-short) ease-out,
				opacity var(--duration-short) ease-out,
				overlay var(--duration-short) allow-discrete,
				display var(--duration-short) allow-discrete;
		}

		.sheet:not([open]) {
			translate: 0 100%;
		}

		.sheet:not([open])::backdrop {
			opacity: 0;
		}

		@starting-style {
			.sheet[open] {
				translate: 0 100%;
			}

			.sheet[open]::backdrop {
				opacity: 0;
			}
		}
	}
</style>
