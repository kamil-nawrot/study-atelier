<script lang="ts">
	import Plus from '@lucide/svelte/icons/plus';
	import Button from '../Button/Button.svelte';
	import Tooltip from '../Tooltip/Tooltip.svelte';

	type Props = {
		label: string;
		href: string;
	};

	let { label, href }: Props = $props();
</script>

<Tooltip align="end" phoneOnly placement="bottom" text={label}>
	{#snippet children(describedby)}
		<Button
			aria-describedby={describedby}
			aria-label={label}
			compact
			{href}
			icon={Plus}
			variant="primary"
		>
			{label}
		</Button>
	{/snippet}
</Tooltip>
