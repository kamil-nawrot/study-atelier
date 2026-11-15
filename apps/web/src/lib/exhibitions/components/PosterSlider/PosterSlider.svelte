<script lang="ts">
	type Props = {
		label: string;
		value: number;
		min: number;
		max: number;
		step?: number;
		shown: string;
		oninput: (value: number) => void;
	};

	let { label, value, min, max, step = 1, shown, oninput }: Props = $props();
</script>

<label class="slider">
	<span>{label}</span>
	<input
		{max}
		{min}
		oninput={(event) => oninput(Number(event.currentTarget.value))}
		{step}
		type="range"
		{value}
	/>
	<output>{shown}</output>
</label>

<style>
	.slider {
		display: grid;
		grid-template-columns: var(--spacing-24) minmax(0, 1fr) var(--spacing-12);
		gap: var(--spacing-3);
		align-items: center;
		font-size: var(--font-size-sm);
		line-height: var(--line-height-sm);
	}

	input {
		width: 100%;
	}

	output {
		color: var(--color-fg-muted);
		font-variant-numeric: tabular-nums;
		text-align: right;
	}
</style>
