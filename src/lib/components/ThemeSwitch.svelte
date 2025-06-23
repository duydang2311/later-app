<script lang="ts">
	import { browser } from '$app/environment';
	import { useRuntime } from '$lib/services/runtime';
	import { applyTheme, isDarkColorScheme } from '$lib/utils';
	import { gsap } from '$lib/utils/transitions';
	import MorphSVGPlugin from 'gsap/dist/MorphSVGPlugin';

	const { theme, colorScheme } = useRuntime();

	if (browser) {
		gsap.registerPlugin(MorphSVGPlugin);
	}

	const onClick = () => {
		colorScheme.current =
			colorScheme.current === 'light'
				? 'dark'
				: colorScheme.current === 'dark'
					? 'system'
					: 'light';
		localStorage.setItem('theme', colorScheme.current);

		const dark = isDarkColorScheme(colorScheme.current);
		if (dark) {
			document.documentElement.setAttribute('data-theme', 'dark');
		} else {
			document.documentElement.removeAttribute('data-theme');
		}
		if (theme.current) {
			applyTheme(theme.current, dark);
		}
	};

	$effect(() => {
		const tl = gsap.timeline();
		if (colorScheme.current === 'dark') {
			tl.to('.ray', {
				opacity: 0,
				duration: 0.05,
				ease: 'circ.inOut',
			}).to('#theme-core', {
				duration: 0.1,
				morphSVG: '#moon',
				ease: 'circ.inOut',
			});
		} else if (colorScheme.current === 'light') {
			tl.to('.laptop', {
				opacity: 0,
				duration: 0.05,
				ease: 'circ.inOut',
			})
				.to('#theme-core', {
					duration: 0.1,
					morphSVG: '#sun-core',
					ease: 'circ.inOut',
				})
				.to('.ray', {
					opacity: 1,
					duration: 0.05,
					stagger: 0.01,
					ease: 'circ.inOut',
				});
		} else {
			tl.to('#theme-core', {
				duration: 0.1,
				morphSVG: '#laptop-core',
				ease: 'circ.inOut',
			}).to('.laptop', {
				opacity: 1,
				duration: 0.05,
				ease: 'circ.inOut',
			});
		}
	});
</script>

<button
	type="button"
	aria-label="Toggle theme"
	title="Toggle theme"
	class="c-button size-6 [view-transition-name:theme-switch]"
	onclick={onClick}
>
	<svg
		id="icon"
		viewBox="0 0 24 24"
		width="100%"
		height="100%"
		fill="none"
		stroke="currentColor"
		stroke-width="2"
		stroke-linecap="round"
		stroke-linejoin="round"
	>
		<path id="theme-core" d="M16,12a4,4 0 1,1 -8,0a4,4 0 1,1 8,0" />

		<path id="sun-core" d="M16,12a4,4 0 1,1 -8,0a4,4 0 1,1 8,0" style="display: none;" />
		<path class="ray opacity-0" d="M12 2v2" />
		<path class="ray opacity-0" d="M12 20v2" />
		<path class="ray opacity-0" d="m4.93 4.93 1.41 1.41" />
		<path class="ray opacity-0" d="m17.66 17.66 1.41 1.41" />
		<path class="ray opacity-0" d="M2 12h2" />
		<path class="ray opacity-0" d="M20 12h2" />
		<path class="ray opacity-0" d="m6.34 17.66-1.41 1.41" />
		<path class="ray opacity-0" d="m19.07 4.93-1.41 1.41" />

		<path id="moon" d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" style="display: none;"></path>

		<path
			id="laptop-core"
			d="M18 5a2 2 0 0 1 2 2v8.526a2 2 0 0 0 .212.897l1.068 2.127a1 1 0 0 1-.9 1.45H3.62a1 1 0 0 1-.9-1.45l1.068-2.127A2 2 0 0 0 4 15.526V7a2 2 0 0 1 2-2z"
			style="display: none;"
		></path>
		<path class="laptop opacity-0" d="M20.054 15.987H3.946"></path>
	</svg>
</button>
