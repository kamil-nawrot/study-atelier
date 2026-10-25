<script lang="ts">
	import ChevronLeft from '@lucide/svelte/icons/chevron-left';
	import ChevronRight from '@lucide/svelte/icons/chevron-right';
	import { Icon, Logo } from '@study-atelier/ui';
	import { m } from '#lib/i18n/i18n.ts';
	import { railExpanded, setRailExpanded } from '#lib/shell/rail/rail.svelte.ts';
	import AtelierMenu from '#lib/shell/AtelierMenu/AtelierMenu.svelte';

	type Props = {
		email: string;
		signingOut: boolean;
		onfeedback: () => void;
		onsignout: () => void;
	};

	let { email, signingOut, onfeedback, onsignout }: Props = $props();
</script>

<nav class="rail" class:expanded={railExpanded()} aria-label={m.menu.label}>
	<button
		class="toggle"
		aria-expanded={railExpanded()}
		aria-label={railExpanded() ? m.menu.collapse : m.menu.expand}
		onclick={() => setRailExpanded(!railExpanded())}
		type="button"
	>
		{#if railExpanded()}
			<Logo label={m.app.name} size="sm" />
			<Icon icon={ChevronLeft} />
		{:else}
			<Icon icon={ChevronRight} />
		{/if}
	</button>
	<div class="menu">
		<AtelierMenu compact={!railExpanded()} {email} {onfeedback} {onsignout} {signingOut} />
	</div>
</nav>

<style>
	.rail {
		display: none;
	}

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

	.menu {
		display: flex;
		flex: 1;
		flex-direction: column;
		justify-content: space-between;
		gap: var(--spacing-6);
	}

	@media (prefers-reduced-motion: no-preference) {
		.rail {
			transition: width var(--duration-short) ease-out;
		}
	}

	@media (min-width: 768px) {
		.rail {
			position: sticky;
			top: 0;
			display: flex;
			flex: none;
			flex-direction: column;
			width: 56px;
			height: 100dvh;
			padding: 0 0 var(--spacing-3);
			overflow: hidden;
			border-right: var(--border-width-base) solid var(--color-line);
		}

		.rail.expanded {
			width: 216px;
		}

		.rail:not(.expanded) .menu :global(.count) {
			display: none;
		}

		.rail:not(.expanded) .menu :global(.badge) {
			display: block;
		}

		.toggle {
			box-sizing: border-box;
			flex: none;
			width: 100%;
			height: calc(var(--size-control) + 2 * var(--spacing-4) + var(--border-width-hairline));
			padding: 0 var(--spacing-4);
			border-bottom: var(--border-width-hairline) solid var(--color-tag);
		}

		.menu {
			padding-top: var(--spacing-8);
		}
	}
</style>
