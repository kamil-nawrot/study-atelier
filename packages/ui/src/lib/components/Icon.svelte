<script lang="ts">
	import type { LucideIcon } from '@lucide/svelte';

	type Props = {
		icon: LucideIcon;
		size?: 'sm' | 'md';
		label?: string;
	};

	let { icon: Glyph, size = 'md', label }: Props = $props();

	const pixels = { sm: 20, md: 24 };
</script>

<Glyph
	aria-hidden={label ? undefined : 'true'}
	aria-label={label}
	role={label ? 'img' : undefined}
	size={pixels[size]}
	stroke-linecap="square"
	stroke-linejoin="miter"
	strokeWidth={2}
/>
