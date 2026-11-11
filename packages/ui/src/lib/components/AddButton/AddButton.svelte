<script lang="ts">
	import Plus from '@lucide/svelte/icons/plus';
	import Button from '../Button/Button.svelte';

	type Props = {
		label: string;
		href: string;
	};

	let { label, href }: Props = $props();
</script>

<span class="add-button">
	<Button aria-label={label} compact {href} icon={Plus} variant="primary">
		{label}
	</Button>
</span>

<style>
	.add-button {
		display: flex;
	}

	@media (max-width: 767.98px) {
		.add-button {
			display: none;
		}
	}
</style>
