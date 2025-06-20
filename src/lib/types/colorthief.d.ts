declare module 'colorthief' {
	export default class ColorThief {
		getColor(image: HTMLImageElement, quality?: number): [number, number, number];
	}
}
