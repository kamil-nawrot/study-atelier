<script lang="ts">
	import ImagesIcon from '@lucide/svelte/icons/images';
	import Plus from '@lucide/svelte/icons/plus';
	import { Button, EmptyState, Icon } from '@study-atelier/ui';
	import { m } from '#lib/i18n/i18n.ts';

	type Props = {
		addPath: string;
	};

	let { addPath }: Props = $props();
</script>

<div class="welcome">
	<EmptyState icon={ImagesIcon} text={m.atelier.welcome.text} title={m.atelier.welcome.title}>
		<Button href={addPath}>
			<Icon icon={Plus} />
			{m.atelier.addFirst}
		</Button>
	</EmptyState>

	<section class="how" aria-labelledby="welcome-how">
		<h2 id="welcome-how">{m.atelier.welcome.howTitle}</h2>
		<ol class="steps">
			{#each m.atelier.welcome.steps as step, index (step.title)}
				<li class="step">
					<span class="number" aria-hidden="true">{index + 1}</span>
					<h3>{step.title}</h3>
					<p>{step.text}</p>
				</li>
			{/each}
		</ol>
	</section>
</div>

<style>
	.welcome {
		display: grid;
		gap: var(--spacing-8);
		padding-block-end: var(--spacing-12);
	}

	.how {
		display: grid;
		gap: var(--spacing-6);
		width: 100%;
		max-width: var(--size-content-wide);
		margin-inline: auto;
	}

	.steps {
		display: grid;
		gap: var(--spacing-8);
		margin: 0;
		padding: 0;
		list-style: none;
	}

	.step {
		display: grid;
		align-content: start;
		gap: var(--spacing-2);
	}

	.number {
		color: var(--color-fg-muted);
		font-size: var(--font-size-2xl);
		line-height: var(--line-height-2xl);
	}

	@media (min-width: 768px) {
		.steps {
			grid-template-columns: repeat(3, 1fr);
		}
	}
</style>
