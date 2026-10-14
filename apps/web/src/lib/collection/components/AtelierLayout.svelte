<script lang="ts">
	import ChevronLeft from '@lucide/svelte/icons/chevron-left';
	import ChevronRight from '@lucide/svelte/icons/chevron-right';
	import Menu from '@lucide/svelte/icons/menu';
	import X from '@lucide/svelte/icons/x';
	import type { Snippet } from 'svelte';
	import { Icon, Logo, ProgressLine } from '@study-atelier/ui';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { navigating } from '$app/state';
	import { signOut } from '#lib/auth/account.ts';
	import { m } from '#lib/i18n/index.ts';
	import AtelierMenu from './AtelierMenu.svelte';

	type Props = {
		title: string;
		email: string;
		bar?: Snippet;
		strip?: Snippet;
		panel?: Snippet;
		children: Snippet;
		confirmLeave?: () => Promise<boolean>;
		fill?: boolean;
		barHeight?: number;
	};

	let {
		title,
		email,
		bar,
		strip,
		panel,
		children,
		confirmLeave,
		fill = false,
		barHeight = $bindable(0)
	}: Props = $props();

	let railExpanded = $state(false);
	let signingOut = $state(false);
	let drawer: HTMLDialogElement;
	let drawerUsed = $state(false);

	function openDrawer(): void {
		drawerUsed = true;
		drawer.showModal();
	}

	function closeDrawerOnLink(event: MouseEvent): void {
		const target = event.target as Element;
		if (target === drawer || target.closest('a')) drawer.close();
	}

	async function submitSignOut(): Promise<void> {
		if (drawer.open) drawer.close();
		if (confirmLeave && !(await confirmLeave())) return;
		signingOut = true;
		await signOut();
		await goto(resolve('/(auth)/sign-in'), { invalidateAll: true });
	}
</script>

<svelte:head>
	<title>{m.app.pageTitle(title)}</title>
</svelte:head>

<div style:--bar-height="{barHeight}px" class="atelier" class:fill>
	<nav class="rail" class:expanded={railExpanded} aria-label={m.menu.label}>
		<button
			class="toggle"
			aria-expanded={railExpanded}
			aria-label={railExpanded ? m.menu.collapse : m.menu.expand}
			onclick={() => (railExpanded = !railExpanded)}
			type="button"
		>
			{#if railExpanded}
				<Logo label={m.app.name} size="sm" />
				<Icon icon={ChevronLeft} />
			{:else}
				<Icon icon={ChevronRight} />
			{/if}
		</button>
		<div class="menu">
			<AtelierMenu {email} onsignout={submitSignOut} {signingOut} />
		</div>
	</nav>

	<div class="main">
		<header class="bar" bind:offsetHeight={barHeight}>
			<button
				class="burger"
				aria-haspopup="dialog"
				aria-label={m.menu.open}
				onclick={openDrawer}
				type="button"
			>
				<Icon icon={Menu} />
			</button>
			{@render bar?.()}
			{#if navigating.to}
				<ProgressLine />
			{/if}
		</header>
		{@render strip?.()}
		<div class="body">
			<main class="content">
				{@render children()}
			</main>
			{@render panel?.()}
		</div>
	</div>

	<dialog bind:this={drawer} class="drawer" aria-label={m.menu.label} onclick={closeDrawerOnLink}>
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
					<AtelierMenu {email} onsignout={submitSignOut} {signingOut} />
				</div>
			</nav>
		{/if}
	</dialog>
</div>

<style>
	.atelier {
		--page-inline: var(--spacing-4);
		display: flex;
		min-height: 100dvh;
	}

	.rail {
		display: none;
	}

	.main {
		--wall-inline: max(var(--page-inline), calc((100% - var(--size-content-wide)) / 2));
		flex: 1;
		min-width: 0;
	}

	.bar {
		position: sticky;
		top: 0;
		z-index: 1;
		display: flex;
		box-sizing: content-box;
		align-items: stretch;
		gap: var(--spacing-2);
		height: var(--size-control);
		padding: var(--spacing-3) var(--page-inline);
		border-bottom: var(--border-width-hairline) solid var(--color-tag);
		background: var(--color-bg);
	}

	.burger,
	.close,
	.toggle {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--spacing-3);
		border: none;
		background: transparent;
		color: var(--color-fg);
		cursor: pointer;
	}

	.burger,
	.close {
		flex: none;
		padding: var(--spacing-2);
	}

	.body {
		display: flex;
		align-items: flex-start;
	}

	.content {
		display: grid;
		flex: 1;
		min-width: 0;
		gap: var(--spacing-6);
		padding: var(--spacing-6) var(--wall-inline) var(--spacing-12);
	}

	.fill .content {
		gap: 0;
		padding: 0;
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
		.rail {
			transition: width var(--duration-short) ease-out;
		}

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

	@media (min-width: 768px) {
		.atelier {
			--page-inline: var(--spacing-6);
		}

		.rail {
			position: sticky;
			top: 0;
			display: flex;
			flex: none;
			flex-direction: column;
			gap: var(--spacing-1);
			width: 56px;
			height: 100dvh;
			padding: var(--spacing-3) 0;
			overflow: hidden;
			border-right: var(--border-width-base) solid var(--color-line);
		}

		.rail.expanded {
			width: 216px;
		}

		.rail:not(.expanded) .menu :global(.label) {
			position: absolute;
			width: 1px;
			height: 1px;
			overflow: hidden;
			clip-path: inset(50%);
			white-space: nowrap;
		}

		.toggle {
			width: 100%;
			padding: var(--spacing-2) var(--spacing-4);
		}

		.burger {
			display: none;
		}

		.bar {
			gap: var(--spacing-3);
			padding: var(--spacing-4) var(--page-inline);
		}

		.content {
			padding: var(--spacing-8) var(--wall-inline) var(--spacing-12);
		}

		.fill .main {
			display: flex;
			flex-direction: column;
			height: 100dvh;
		}

		.fill .body {
			flex: 1;
			min-height: 0;
		}

		.fill .content {
			align-self: stretch;
			min-height: 0;
			padding: 0;
		}
	}
</style>
