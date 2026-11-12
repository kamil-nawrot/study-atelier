<script lang="ts">
	import { Logo } from '@study-atelier/ui';
	import { m } from '#lib/i18n/i18n.ts';
	import AtelierMenu from '#lib/shell/AtelierMenu/AtelierMenu.svelte';
	import BottomSheet from '#lib/shell/BottomSheet/BottomSheet.svelte';

	type Props = {
		email: string;
		signingOut: boolean;
		onfeedback: () => void;
		onsignout: () => void;
	};

	let { email, signingOut, onfeedback, onsignout }: Props = $props();

	let sheet: ReturnType<typeof BottomSheet>;

	export function open(): void {
		sheet.open();
	}

	export function close(): void {
		sheet.close();
	}
</script>

<BottomSheet bind:this={sheet} closeLabel={m.menu.close} label={m.menu.label}>
	{#snippet top()}
		<span class="brand">
			<Logo label={m.app.name} size="sm" />
		</span>
	{/snippet}
	<nav aria-label={m.menu.label}>
		<AtelierMenu barItems={false} {email} {onfeedback} {onsignout} {signingOut} />
	</nav>
</BottomSheet>

<style>
	.brand {
		display: flex;
		padding-inline-start: var(--spacing-4);
	}

	nav {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-6);
	}
</style>
