import { hexFromArgb, themeFromSourceColor, type Theme } from '@material/material-color-utilities';
import ColorThief from 'colorthief';

let colorThief: ColorThief;

export const getUserLocales = () => {
	return navigator.languages || [navigator.language || 'en-US'];
};

export const getDominantArgb = (imageEl: HTMLImageElement) => {
	colorThief ??= new ColorThief();
	const [r, g, b] = colorThief.getColor(imageEl);
	return (0xff << 24) | (r << 16) | (g << 8) | b;
};

export const generateThemeFromArgb = (argb: number) => {
	return themeFromSourceColor(argb);
};

export const applyTheme = (theme: Theme, dark?: boolean) => {
	dark ??= window.matchMedia('(prefers-color-scheme: dark)').matches;
	document.documentElement.style.setProperty(
		'--color-base',
		hexFromArgb(dark ? theme.schemes.dark.surface : theme.schemes.light.surface)
	);
	document.documentElement.style.setProperty(
		'--color-base-fg',
		hexFromArgb(dark ? theme.schemes.dark.onSurface : theme.schemes.light.onSurface)
	);
	document.documentElement.style.setProperty(
		'--color-base-variant',
		hexFromArgb(dark ? theme.schemes.dark.surfaceVariant : theme.schemes.light.surfaceVariant)
	);
	document.documentElement.style.setProperty(
		'--color-base-variant-fg',
		hexFromArgb(dark ? theme.schemes.dark.onSurfaceVariant : theme.schemes.light.onSurfaceVariant)
	);
	document.documentElement.style.setProperty(
		'--color-primary',
		hexFromArgb(dark ? theme.schemes.dark.primary : theme.schemes.light.primary)
	);
	document.documentElement.style.setProperty(
		'--color-primary-fg',
		hexFromArgb(dark ? theme.schemes.dark.onPrimary : theme.schemes.light.onPrimary)
	);
	document.documentElement.style.setProperty(
		'--color-primary-container',
		hexFromArgb(dark ? theme.schemes.dark.primaryContainer : theme.schemes.light.primaryContainer)
	);
	document.documentElement.style.setProperty(
		'--color-primary-container-fg',
		hexFromArgb(
			dark ? theme.schemes.dark.onPrimaryContainer : theme.schemes.light.onPrimaryContainer
		)
	);
	document.documentElement.style.setProperty(
		'--color-secondary',
		hexFromArgb(dark ? theme.schemes.dark.secondary : theme.schemes.light.secondary)
	);
	document.documentElement.style.setProperty(
		'--color-secondary-fg',
		hexFromArgb(dark ? theme.schemes.dark.onSecondary : theme.schemes.light.onSecondary)
	);
	document.documentElement.style.setProperty(
		'--color-secondary-container',
		hexFromArgb(
			dark ? theme.schemes.dark.secondaryContainer : theme.schemes.light.secondaryContainer
		)
	);
	document.documentElement.style.setProperty(
		'--color-secondary-container-fg',
		hexFromArgb(
			dark ? theme.schemes.dark.onSecondaryContainer : theme.schemes.light.onSecondaryContainer
		)
	);
	document.documentElement.style.setProperty(
		'--color-tertiary',
		hexFromArgb(dark ? theme.schemes.dark.tertiary : theme.schemes.light.tertiary)
	);
	document.documentElement.style.setProperty(
		'--color-tertiary-fg',
		hexFromArgb(dark ? theme.schemes.dark.onTertiary : theme.schemes.light.onTertiary)
	);
	document.documentElement.style.setProperty(
		'--color-tertiary-container',
		hexFromArgb(dark ? theme.schemes.dark.tertiaryContainer : theme.schemes.light.tertiaryContainer)
	);
	document.documentElement.style.setProperty(
		'--color-tertiary-container-fg',
		hexFromArgb(
			dark ? theme.schemes.dark.onTertiaryContainer : theme.schemes.light.onTertiaryContainer
		)
	);
	document.documentElement.style.setProperty(
		'--color-negative',
		hexFromArgb(dark ? theme.schemes.dark.error : theme.schemes.light.error)
	);
	document.documentElement.style.setProperty(
		'--color-negative-fg',
		hexFromArgb(dark ? theme.schemes.dark.onError : theme.schemes.light.onError)
	);
	document.documentElement.style.setProperty(
		'--color-negative-container',
		hexFromArgb(dark ? theme.schemes.dark.errorContainer : theme.schemes.light.errorContainer)
	);
	document.documentElement.style.setProperty(
		'--color-negative-container-fg',
		hexFromArgb(dark ? theme.schemes.dark.onErrorContainer : theme.schemes.light.onErrorContainer)
	);
	document.documentElement.style.setProperty(
		'--color-outline',
		hexFromArgb(dark ? theme.schemes.dark.outline : theme.schemes.light.outline)
	);
	document.documentElement.style.setProperty(
		'--color-outline-variant',
		hexFromArgb(dark ? theme.schemes.dark.outlineVariant : theme.schemes.light.outlineVariant)
	);
};

export const getUserPreferredColorScheme = () => {
	const theme = localStorage.getItem('theme');
	if (theme !== 'dark' && theme !== 'light') {
		return 'system';
	}
	return theme;
};

export const isDarkColorScheme = (colorScheme: string) => {
	return (
		colorScheme === 'dark' ||
		(colorScheme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
	);
};

export const logError = (description: string) => (e: unknown) => {
	console.error(`${description}: ${e}`);
};
