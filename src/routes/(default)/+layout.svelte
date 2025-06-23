<script lang="ts">
	import ThemeSwitch from '$lib/components/ThemeSwitch.svelte';
	import { Github } from '@lucide/svelte';
	import type { LayoutProps } from './$types';
	import BgUpload from './BgUpload.svelte';

	const { children }: LayoutProps = $props();
</script>

<div class="flex justify-between items-center p-4 gap-8">
	<span class="font-playful lowercase font-medium text-h1">Later</span>
	<div class="flex gap-4">
		<BgUpload />
		<ThemeSwitch />
		<a
			href="https://github.com/duydang2311/later-app"
			aria-label="Github"
			target="_blank"
			title="Open Github"
			class="[view-transition-name:github-link]"
		>
			<Github />
		</a>
	</div>
</div>
{@render children()}
