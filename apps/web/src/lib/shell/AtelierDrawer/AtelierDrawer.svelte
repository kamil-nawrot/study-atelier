<script lang="ts">
	import X from '@lucide/svelte/icons/x';
	import { Icon, Logo } from '@study-atelier/ui';
	import { m } from '#lib/i18n/i18n.ts';
	import AtelierMenu from '#lib/shell/AtelierMenu/AtelierMenu.svelte';

	type Props = {
		email: string;
		signingOut: boolean;
		onfeedback: () => void;
		onsignout: () => void;
	};

	let { email, signingOut, onfeedback, onsignout }: Props = $props();

	let drawer: HTMLDialogElement;
	let drawerUsed = $state(false);

	export function open(): void {
		drawerUsed = true;
		drawer.showModal();
	}

	export function close(): void {
		if (drawer.open) drawer.close();
	}

	function closeOnLink(event: MouseEvent): void {
		const target = event.target as Element;
		if (target === drawer || target.closest('a')) drawer.close();
	}
</script>

<dialog bind:this={drawer} class="drawer" aria-label={m.menu.label} onclick={closeOnLink}>
	{#if drawerUsed}
		<nav aria-label={m.menu.label}>
			<div class="drawer-top">
				<Logo label={m.app.name} size="sm" />
				<button
					class="close"
					aria-label={m.menu.close}
					onclick={() => drawer.close()}
					type="button"
				>
					<Icon icon={X} />
				</button>
			</div>
			<div class="menu">
				<AtelierMenu {email} {onfeedback} {onsignout} {signingOut} />
			</div>
		</nav>
	{/if}
</dialog>

<style>
	.close {
		display: flex;
		flex: none;
		align-items: center;
		justify-content: space-between;
		gap: var(--spacing-3);
		padding: var(--spacing-2);
		border: none;
		background: transparent;
		color: var(--color-fg);
		cursor: pointer;
	}

	.menu {
		display: flex;
		flex: 1;
		flex-direction: column;
		justify-content: space-between;
		gap: var(--spacing-6);
	}

	.drawer {
		inset: 0 auto 0 0;
		width: min(260px, 85vw);
		max-width: none;
		height: auto;
		max-height: none;
		margin: 0;
		padding: var(--spacing-3) 0;
		border: none;
		border-right: var(--border-width-base) solid var(--color-line);
		background: var(--color-bg);
		color: var(--color-fg);
	}

	.drawer::backdrop {
		background: var(--color-scrim);
	}

	@supports (backdrop-filter: blur(1px)) {
		.drawer::backdrop {
			backdrop-filter: blur(var(--blur-scrim));
		}
	}

	:global(html:has(.drawer[open])) {
		overflow: hidden;
	}

	@media (prefers-reduced-motion: no-preference) {
		.drawer,
		.drawer::backdrop {
			transition:
				translate var(--duration-short) ease-out,
				opacity var(--duration-short) ease-out,
				overlay var(--duration-short) allow-discrete,
				display var(--duration-short) allow-discrete;
		}

		.drawer:not([open]) {
			translate: -100% 0;
		}

		.drawer:not([open])::backdrop {
			opacity: 0;
		}

		@starting-style {
			.drawer[open] {
				translate: -100% 0;
			}

			.drawer[open]::backdrop {
				opacity: 0;
			}
		}
	}

	.drawer nav {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-1);
		height: 100%;
	}

	.drawer-top {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0 var(--spacing-1) 0 var(--spacing-4);
	}
</style>
