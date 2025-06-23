<script lang="ts">
	import ThemeSwitch from '$lib/components/ThemeSwitch.svelte';
	import { Github } from '@lucide/svelte';
	import { type Snippet } from 'svelte';

	const { children }: { children: Snippet } = $props();
</script>

<div class="flex justify-between p-4 gap-8">
	<span class="font-playful lowercase font-medium text-2xl">Later</span>
	<div class="flex gap-4">
		<ThemeSwitch />
		<a
			href="https://github.com/duydang2311/later-app"
			aria-label="Github"
			target="_blank"
			title="Open Github"
		>
			<Github />
		</a>
	</div>
</div>
{@render children()}
