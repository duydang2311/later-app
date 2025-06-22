import __gsap from 'gsap';
import { createGSAPTransition } from '@duydang2311/svutils';

export const gsap = Object.assign({}, __gsap, {
	to: (targets: gsap.TweenTarget, vars: gsap.TweenVars): gsap.core.Tween =>
		__gsap.to(targets, { overwrite: 'auto', duration: 0.15, ...vars }),
	from: (targets: gsap.TweenTarget, vars: gsap.TweenVars): gsap.core.Tween =>
		__gsap.from(targets, { overwrite: 'auto', duration: 0.15, ...vars }),
	fromTo: (
		targets: gsap.TweenTarget,
		fromVars: gsap.TweenVars,
		toVars: gsap.TweenVars
	): gsap.core.Tween =>
		__gsap.fromTo(
			targets,
			{
				overwrite: 'auto',
				...fromVars,
			},
			{
				duration: 0.15,
				...toVars,
			}
		),
});

export const tsap = createGSAPTransition(gsap);
