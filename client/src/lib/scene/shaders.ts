export const fieldVertex = /* glsl */ `
  uniform float uTime;
  uniform float uStage;
  uniform float uFlow;
  uniform float uTunnel;
  uniform float uPixel;
  uniform float uOpacity;
  uniform float uPulse;
  uniform float uStep;
  uniform vec4 uRecords;
  uniform vec3 uPointer;
  uniform sampler2D uStroke;

  attribute vec4 aSeed;
  attribute vec3 aOffset;
  attribute float aArm;
  attribute vec3 aRing;
  attribute vec3 aEnvelope;
  attribute vec3 aGalaxy;

  varying vec3 vColor;
  varying float vAlpha;

  const float TAU = 6.28318530718;
  const vec3 PAPER = vec3(0.74, 0.8, 0.76);
  const vec3 SIGNAL = vec3(0.086, 1.0, 0.0);
  const vec3 FAULT = vec3(1.0, 0.23, 0.19);

  mat2 rot(float a) {
    float c = cos(a);
    float s = sin(a);
    return mat2(c, -s, s, c);
  }

  float strokeT() {
    return fract(aSeed.x + uTime * 0.011 + uFlow);
  }

  vec3 addressShape() {
    vec4 sampleAt = texture2D(uStroke, vec2(strokeT(), 0.5));
    float halo = step(0.93, aSeed.y) * 0.17;
    return sampleAt.xyz + aOffset * (sampleAt.w + halo);
  }

  vec3 tunnelShape() {
    float t = fract(aSeed.x + uTime * 0.008 + uTunnel);
    float theta = t * 7.0 * TAU + aArm * (TAU / 4.0);
    float radius = 2.55 + aOffset.x * 0.05;
    return vec3(cos(theta) * radius, sin(theta) * radius, 7.0 - t * 42.0) + aOffset * 0.03;
  }

  float recordHealth() {
    vec4 pick = vec4(equal(vec4(aArm), vec4(0.0, 1.0, 2.0, 3.0)));
    return dot(uRecords, pick);
  }

  vec3 gyroscopeShape() {
    vec3 p = aRing;
    p.xy = rot(uTime * (0.1 + aArm * 0.05)) * p.xy;
    p.yz = rot(1.0 + aArm * 0.52) * p.yz;
    p.xz = rot(aArm * 0.8 + uTime * 0.06) * p.xz;
    float broken = 1.0 - recordHealth();
    vec3 drift = aOffset * (0.34 + 0.2 * sin(uTime * 1.4 + aSeed.y * TAU));
    return p + drift * broken;
  }

  vec3 envelopeShape() {
    vec3 p = aEnvelope;
    p.z += sin(uTime * 0.7 + p.x * 1.4) * 0.03;
    return p;
  }

  vec3 galaxyShape() {
    vec3 p = aGalaxy;
    p.xy = rot(uTime * 0.018) * p.xy;
    return p;
  }

  vec3 shapeAt(float index) {
    if (index < 0.5) return addressShape();
    if (index < 1.5) return tunnelShape();
    if (index < 2.5) return gyroscopeShape();
    if (index < 3.5) return envelopeShape();
    if (index < 4.5) return galaxyShape();
    return addressShape();
  }

  void main() {
    float from = floor(uStage);
    float to = min(from + 1.0, 5.0);
    float raw = uStage - from;

    // Each particle departs at its own moment, so shapes dissolve, never cut.
    float delay = aSeed.y * 0.42;
    float travel = smoothstep(delay, delay + 0.58, raw);
    vec3 position3 = mix(shapeAt(from), shapeAt(to), travel);

    // Every morph is routed through a whirl: spirals are the house motion.
    float whirl = sin(travel * 3.14159265);
    position3.xy = rot(whirl * (1.5 + aSeed.w * 1.2)) * position3.xy;
    position3 += aOffset * whirl * 0.16;

    vec4 viewPosition = modelViewMatrix * vec4(position3, 1.0);

    // The pointer parts the field like a hand through smoke.
    vec2 toPointer = viewPosition.xy - uPointer.xy;
    float reach = exp(-dot(toPointer, toPointer) * 2.1) * uPointer.z;
    viewPosition.xy += normalize(toPointer + 1e-4) * reach * 0.34;

    gl_Position = projectionMatrix * viewPosition;
    float depth = max(-viewPosition.z, 0.25);
    gl_PointSize = clamp(aSeed.z * uPixel * (15.0 / depth), 1.6, 15.0 * uPixel);

    // Scene weights: how much of each shape this particle currently is.
    float weightFrom = 1.0 - travel;
    float isAddress = (from < 0.5 || from > 4.5 ? weightFrom : 0.0) + (to < 0.5 || to > 4.5 ? travel : 0.0);
    float isTunnel = (abs(from - 1.0) < 0.5 ? weightFrom : 0.0) + (abs(to - 1.0) < 0.5 ? travel : 0.0);
    float isGyroscope = (abs(from - 2.0) < 0.5 ? weightFrom : 0.0) + (abs(to - 2.0) < 0.5 ? travel : 0.0);

    float accent = smoothstep(0.885, 0.92, aSeed.w);
    vec3 color = mix(PAPER, SIGNAL, accent);
    float alpha = 0.5 + accent * 0.4;

    // Packets of mail moving down the stream, plus keystroke pulses.
    float t = strokeT();
    float packet = pow(0.5 + 0.5 * sin(t * TAU * 5.0 - uTime * 1.3), 26.0);
    float burst = exp(-pow((t - uPulse) * 34.0, 2.0)) * step(0.0, uPulse);
    float lit = clamp(packet * 0.75 + burst * 1.8, 0.0, 1.8) * isAddress;
    color = mix(color, SIGNAL, min(lit, 1.0));
    alpha += lit * 0.7;

    // Fade both ends of the stream so it has no visible start or finish.
    float ends = smoothstep(0.0, 0.1, t) * (1.0 - smoothstep(0.985, 1.0, t));
    alpha *= mix(1.0, ends, isAddress);

    // The arm of the active step burns brighter, and the tunnel fades at depth.
    float focus = 1.0 - min(abs(aArm - uStep), 1.0);
    color = mix(color, SIGNAL, focus * 0.72 * isTunnel);
    alpha *= mix(1.0, 0.8 + focus * 1.3, isTunnel);
    alpha *= mix(1.0, smoothstep(44.0, 10.0, depth) * smoothstep(0.4, 2.2, depth), isTunnel);

    // A failing record turns its ring to fault-red as it falls apart.
    float broken = (1.0 - recordHealth()) * isGyroscope;
    color = mix(color, FAULT, broken);
    float healthy = (1.0 - broken) * isGyroscope;
    color = mix(color, SIGNAL, healthy * 0.46);

    vColor = color;
    vAlpha = alpha * uOpacity;
  }
`;

export const fieldFragment = /* glsl */ `
  varying vec3 vColor;
  varying float vAlpha;

  void main() {
    float d = length(gl_PointCoord - 0.5);
    float falloff = smoothstep(0.5, 0.05, d);
    gl_FragColor = vec4(vColor, falloff * falloff * vAlpha);
  }
`;
