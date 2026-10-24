<script lang="ts">
	import type { LucideIcon } from '@lucide/svelte';
	import Button from '../Button/Button.svelte';
	import Icon from '../Icon/Icon.svelte';

	type Props = {
		label: string;
		accept?: string;
		icon?: LucideIcon;
		disabled?: boolean;
		describedby?: string;
		onpick: (file: File) => void;
	};

	let { label, accept, icon, disabled = false, describedby, onpick }: Props = $props();

	let input: HTMLInputElement | undefined = $state();

	function pick(event: Event & { currentTarget: HTMLInputElement }): void {
		const file = event.currentTarget.files?.[0];
		event.currentTarget.value = '';
		if (file) onpick(file);
	}
</script>

<Button aria-describedby={describedby} {disabled} onclick={() => input?.click()}>
	{#if icon}
		<Icon {icon} size="sm" />
	{/if}
	{label}
</Button>
<input bind:this={input} {accept} {disabled} hidden onchange={pick} type="file" />
