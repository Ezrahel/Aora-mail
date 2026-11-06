/**
 * Bridge between the DOM and the WebGL scene. It is a plain mutable object on
 * purpose: these values change on every keystroke and scroll tick, and routing
 * them through React state would re-render the page to move a uniform.
 */
export const sceneState = {
  /** One entry per record (MX, SPF, DKIM, DMARC). 1 = healthy, 0 = broken. */
  records: [1, 1, 1, 1] as [number, number, number, number],
  /** Set to the clock time of the most recent pulse; negative means none yet. */
  pulseAt: -100,
  /** Which of the four setup steps is in focus inside the tunnel. */
  step: 0,
};

let pulseRequested = false;

/** Sends one bright packet down the spiral, e.g. on a keystroke. */
export function firePulse() {
  pulseRequested = true;
}

export function consumePulse() {
  const requested = pulseRequested;
  pulseRequested = false;
  return requested;
}

export function resetScene() {
  sceneState.records = [1, 1, 1, 1];
  sceneState.step = 0;
}

/** Scene ids, in morph order. Sections opt in with `data-scene={SCENES.x}`. */
export const SCENES = {
  address: 0,
  tunnel: 1,
  gyroscope: 2,
  envelope: 3,
  galaxy: 4,
  finale: 5,
} as const;
