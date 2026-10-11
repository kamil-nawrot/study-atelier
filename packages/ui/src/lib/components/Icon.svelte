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
	size={pixels[size]}
	strokeWidth={2}
	stroke-linecap="square"
	stroke-linejoin="miter"
	role={label ? 'img' : undefined}
	aria-label={label}
	aria-hidden={label ? undefined : 'true'}
/>
