"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import {
  AdditiveBlending,
  BoxGeometry,
  BufferAttribute,
  BufferGeometry,
  Color,
  DataTexture,
  FloatType,
  type Group,
  type InstancedMesh,
  MathUtils,
  NearestFilter,
  Object3D,
  Quaternion,
  RepeatWrapping,
  RGBAFormat,
  ShaderMaterial,
  Vector3,
} from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { fieldFragment, fieldVertex } from "@/lib/scene/shaders";
import { buildField, buildStroke, CURVE_SIZE, particleBudget, sampleStroke } from "@/lib/scene/shapes";
import { consumePulse, sceneState } from "@/lib/scene/store";

interface Pose {
  x: number;
  y: number;
  scale: number;
  tiltX: number;
  tiltY: number;
  opacity: number;
}

/** Where the object sits in each scene, leaving room for that section's copy. */
const WIDE_POSES: Pose[] = [
  { x: 2.45, y: -0.02, scale: 1.72, tiltX: 0.04, tiltY: -0.3, opacity: 1 },
  { x: 0, y: 0, scale: 1, tiltX: 0, tiltY: 0, opacity: 1 },
  { x: 3.1, y: 0.05, scale: 0.92, tiltX: 0.1, tiltY: -0.2, opacity: 1 },
  { x: 2.5, y: 0.82, scale: 0.86, tiltX: -0.2, tiltY: -0.42, opacity: 1 },
  { x: 0, y: -1.1, scale: 1.12, tiltX: -1.08, tiltY: 0, opacity: 0.85 },
  { x: 2.45, y: 0, scale: 1.72, tiltX: 0.04, tiltY: -0.3, opacity: 1 },
];

const NARROW_POSES: Pose[] = [
  { x: 0, y: 1.72, scale: 0.84, tiltX: 0.04, tiltY: -0.2, opacity: 0.8 },
  { x: 0, y: 0, scale: 0.72, tiltX: 0, tiltY: 0, opacity: 0.55 },
  { x: 0, y: 0.4, scale: 0.8, tiltX: 0.1, tiltY: -0.2, opacity: 0.2 },
  { x: 0, y: 0.2, scale: 0.72, tiltX: -0.2, tiltY: -0.3, opacity: 0.3 },
  { x: 0, y: -0.6, scale: 0.8, tiltX: -1.08, tiltY: 0, opacity: 0.5 },
  { x: 0, y: 1.5, scale: 0.84, tiltX: 0.04, tiltY: -0.2, opacity: 0.7 },
];

function poseAt(poses: Pose[], stage: number): Pose {
  const from = Math.min(Math.floor(stage), poses.length - 1);
  const to = Math.min(from + 1, poses.length - 1);
  const k = MathUtils.smootherstep(stage - from, 0, 1);
  const a = poses[from];
  const b = poses[to];
  return {
    x: MathUtils.lerp(a.x, b.x, k),
    y: MathUtils.lerp(a.y, b.y, k),
    scale: MathUtils.lerp(a.scale, b.scale, k),
    tiltX: MathUtils.lerp(a.tiltX, b.tiltX, k),
    tiltY: MathUtils.lerp(a.tiltY, b.tiltY, k),
    opacity: MathUtils.lerp(a.opacity, b.opacity, k),
  };
}

interface SceneSection {
  scene: number;
  top: number;
  bottom: number;
}

function measureSections(): SceneSection[] {
  return Array.from(document.querySelectorAll<HTMLElement>("[data-scene]"))
    .map((element) => {
      const rect = element.getBoundingClientRect();
      return {
        scene: Number(element.dataset.scene),
        top: rect.top + window.scrollY,
        bottom: rect.bottom + window.scrollY,
      };
    })
    .sort((a, b) => a.top - b.top);
}

/** Holds a scene while its section fills the screen and morphs across the seam. */
function stageForScroll(sections: SceneSection[], centre: number, band: number, fallback: number) {
  if (sections.length === 0) return fallback;
  for (let i = 0; i < sections.length - 1; i++) {
    const current = sections[i];
    const next = sections[i + 1];
    const start = current.bottom - band;
    const end = next.top + band;
    if (centre <= start) return current.scene;
    if (centre <= end) return MathUtils.lerp(current.scene, next.scene, (centre - start) / (end - start));
  }
  return sections[sections.length - 1].scene;
}

function envelopeGeometry() {
  const body = new BoxGeometry(1, 0.66, 0.035);
  const flap = new BufferGeometry();
  flap.setAttribute(
    "position",
    new BufferAttribute(new Float32Array([-0.5, 0.33, 0.02, 0.5, 0.33, 0.02, 0, -0.06, 0.07]), 3),
  );
  flap.setAttribute("normal", new BufferAttribute(new Float32Array([0, 0.4, 0.92, 0, 0.4, 0.92, 0, 0.4, 0.92]), 3));
  flap.setAttribute("uv", new BufferAttribute(new Float32Array([0, 1, 1, 1, 0.5, 0.5]), 2));
  flap.setIndex([0, 2, 1]);
  const merged = mergeGeometries([body.toNonIndexed(), flap.toNonIndexed()]);
  body.dispose();
  flap.dispose();
  return merged;
}

const ENVELOPES = 54;
const STREAM_SPEED = 0.011;

function Riders({ stroke, stageRef, timeRef }: {
  stroke: Float32Array;
  stageRef: React.RefObject<number>;
  timeRef: React.RefObject<number>;
}) {
  const mesh = useRef<InstancedMesh>(null);
  const geometry = useMemo(() => envelopeGeometry(), []);
  const seats = useMemo(
    () => Array.from({ length: ENVELOPES }, (_, index) => ({
      t: index / ENVELOPES,
      spin: new Vector3(Math.sin(index * 12.9), Math.cos(index * 78.2), Math.sin(index * 37.7)).normalize(),
      rate: 0.3 + ((index * 7) % 11) / 16,
    })),
    [],
  );
  const scratch = useMemo(
    () => ({ dummy: new Object3D(), here: new Vector3(), ahead: new Vector3(), quaternion: new Quaternion() }),
    [],
  );

  useEffect(() => {
    const instance = mesh.current;
    if (!instance) return;
    const paper = new Color("#8f9a92");
    const signal = new Color("#0c9a00");
    seats.forEach((_, index) => instance.setColorAt(index, index % 11 === 0 ? signal : paper));
    if (instance.instanceColor) instance.instanceColor.needsUpdate = true;
  }, [seats]);

  useEffect(() => () => geometry.dispose(), [geometry]);

  useFrame(() => {
    const instance = mesh.current;
    if (!instance) return;
    const stage = stageRef.current;
    const time = timeRef.current;
    // Riders belong to the address scenes and leave as the morph begins.
    const presence = 1 - MathUtils.smoothstep(Math.min(stage, 5 - stage), 0.02, 0.3);
    const { dummy, here, ahead, quaternion } = scratch;

    seats.forEach((seat, index) => {
      const t = (seat.t + time * STREAM_SPEED) % 1;
      sampleStroke(stroke, t, here);
      sampleStroke(stroke, t + 0.002, ahead);
      dummy.position.copy(here);
      dummy.lookAt(ahead);
      quaternion.setFromAxisAngle(seat.spin, time * seat.rate);
      dummy.quaternion.multiply(quaternion);
      // Each envelope dissolves into the stream as it reaches the glyph.
      const arriving = 1 - MathUtils.smoothstep(t, 0.3, 0.4);
      const emerging = MathUtils.smoothstep(t, 0.02, 0.09);
      dummy.scale.setScalar(0.15 * arriving * emerging * presence + 1e-4);
      dummy.updateMatrix();
      instance.setMatrixAt(index, dummy.matrix);
    });
    instance.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={mesh} args={[geometry, undefined, ENVELOPES]} frustumCulled={false}>
      <meshStandardMaterial roughness={0.48} metalness={0.05} />
    </instancedMesh>
  );
}

interface FrameInput {
  time: number;
  stage: number;
  flow: number;
  tunnel: number;
  pixel: number;
  opacity: number;
  pulse: number;
  pointerX: number;
  pointerY: number;
  pointerStrength: number;
  delta: number;
  instant: boolean;
}

/** Owns the particle buffers and shader, which change on every frame. */
class ParticleField {
  readonly geometry = new BufferGeometry();
  readonly material: ShaderMaterial;
  private readonly texture: DataTexture;
  private readonly count: number;
  private readonly records = [1, 1, 1, 1];
  private readonly pointer = new Vector3();

  constructor(stroke: Float32Array) {
    this.count = particleBudget(window.innerWidth, navigator.hardwareConcurrency || 4);
    const data = buildField(this.count);
    this.geometry.setAttribute("position", new BufferAttribute(new Float32Array(this.count * 3), 3));
    this.geometry.setAttribute("aSeed", new BufferAttribute(data.seed, 4));
    this.geometry.setAttribute("aOffset", new BufferAttribute(data.offset, 3));
    this.geometry.setAttribute("aArm", new BufferAttribute(data.arm, 1));
    this.geometry.setAttribute("aRing", new BufferAttribute(data.ring, 3));
    this.geometry.setAttribute("aEnvelope", new BufferAttribute(data.envelope, 3));
    this.geometry.setAttribute("aGalaxy", new BufferAttribute(data.galaxy, 3));

    this.texture = new DataTexture(stroke, CURVE_SIZE, 1, RGBAFormat, FloatType);
    this.texture.minFilter = NearestFilter;
    this.texture.magFilter = NearestFilter;
    this.texture.wrapS = RepeatWrapping;
    this.texture.needsUpdate = true;

    this.material = new ShaderMaterial({
      vertexShader: fieldVertex,
      fragmentShader: fieldFragment,
      transparent: true,
      depthWrite: false,
      blending: AdditiveBlending,
      uniforms: {
        uTime: { value: 0 },
        uStage: { value: 0 },
        uFlow: { value: 0 },
        uTunnel: { value: 0 },
        uPixel: { value: 1 },
        uOpacity: { value: 1 },
        uPulse: { value: -1 },
        uStep: { value: 0 },
        uRecords: { value: this.records },
        uPointer: { value: this.pointer },
        uStroke: { value: this.texture },
      },
    });
  }

  update(frame: FrameInput) {
    const { uniforms } = this.material;
    uniforms.uTime.value = frame.time;
    uniforms.uStage.value = frame.stage;
    uniforms.uFlow.value = frame.flow;
    uniforms.uTunnel.value = frame.tunnel;
    uniforms.uPixel.value = frame.pixel;
    uniforms.uOpacity.value = frame.opacity;
    uniforms.uPulse.value = frame.pulse;
    uniforms.uStep.value = MathUtils.damp(uniforms.uStep.value, sceneState.step, 6, frame.delta);
    sceneState.records.forEach((value, index) => {
      this.records[index] = frame.instant ? value : MathUtils.damp(this.records[index], value, 5, frame.delta);
    });
    this.pointer.set(frame.pointerX, frame.pointerY, frame.pointerStrength);
  }

  /** Draws only a share of the particles. They are shuffled, so density holds. */
  thin(share: number) {
    this.geometry.setDrawRange(0, Math.floor(this.count * share));
  }

  dispose() {
    this.geometry.dispose();
    this.material.dispose();
    this.texture.dispose();
  }
}

interface FieldProps {
  /** Pin to one scene instead of following the page scroll. */
  pinnedScene?: number;
  /** Changes whenever the page changes, so sections are measured again. */
  routeKey?: string;
  still: boolean;
  poseOverride?: Partial<Pose>;
}

function Field({ pinnedScene, routeKey, still, poseOverride }: FieldProps) {
  const group = useRef<Group>(null);
  const stageRef = useRef(pinnedScene ?? 0);
  const timeRef = useRef(still ? 42 : 0);
  const pulseRef = useRef(-1);
  const load = useRef({ frames: 0, spent: 0, settled: false, step: 0 });
  const pointer = useRef({ x: 0, y: 0, strength: 0, target: 0, swayX: 0, swayY: 0 });
  const sections = useRef<SceneSection[]>([]);

  const size = useThree((state) => state.size);
  const setDpr = useThree((state) => state.setDpr);
  const invalidate = useThree((state) => state.invalidate);
  const camera = useThree((state) => state.camera);

  const stroke = useMemo(() => buildStroke(), []);

  const field = useMemo(() => new ParticleField(stroke), [stroke]);

  useEffect(() => () => field.dispose(), [field]);

  useEffect(() => {
    if (pinnedScene !== undefined) return;
    const measure = () => {
      sections.current = measureSections();
      if (still) invalidate();
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(document.body);
    const onScroll = () => invalidate();
    if (still) window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", onScroll);
    };
  }, [pinnedScene, routeKey, still, invalidate]);

  useEffect(() => {
    if (still) return;
    const onMove = (event: PointerEvent) => {
      if (event.pointerType === "touch") return;
      pointer.current.x = (event.clientX / window.innerWidth) * 2 - 1;
      pointer.current.y = -((event.clientY / window.innerHeight) * 2 - 1);
      pointer.current.target = 1;
    };
    const onLeave = () => { pointer.current.target = 0; };
    window.addEventListener("pointermove", onMove, { passive: true });
    document.documentElement.addEventListener("pointerleave", onLeave);
    return () => {
      window.removeEventListener("pointermove", onMove);
      document.documentElement.removeEventListener("pointerleave", onLeave);
    };
  }, [still]);

  useFrame((state, rawDelta) => {
    const delta = Math.min(rawDelta, 0.05);
    if (!still) timeRef.current += delta;

    const viewport = window.innerHeight;
    const target = pinnedScene ?? stageForScroll(sections.current, window.scrollY + viewport / 2, viewport * 0.38, stageRef.current);
    stageRef.current = still ? target : MathUtils.damp(stageRef.current, target, 3.4, delta);
    const stage = stageRef.current;

    const narrow = size.width < 900;
    const pose = { ...poseAt(narrow ? NARROW_POSES : WIDE_POSES, stage), ...poseOverride };

    const hand = pointer.current;
    hand.strength = MathUtils.damp(hand.strength, hand.target, 4, delta);
    hand.swayX = MathUtils.damp(hand.swayX, hand.x, 2.4, delta);
    hand.swayY = MathUtils.damp(hand.swayY, hand.y, 2.4, delta);

    const object = group.current;
    if (object) {
      const breathe = still ? 0 : Math.sin(timeRef.current * 0.32) * 0.07;
      object.position.set(pose.x, pose.y, 0);
      object.scale.setScalar(pose.scale);
      object.rotation.set(pose.tiltX - hand.swayY * 0.13, pose.tiltY + breathe + hand.swayX * 0.2, 0);
    }

    if (consumePulse()) pulseRef.current = 0.34;
    if (pulseRef.current >= 0) {
      pulseRef.current += delta * 0.42;
      if (pulseRef.current > 1.02) pulseRef.current = -1;
    }

    const halfHeight = Math.tan(MathUtils.degToRad(20)) * camera.position.z;
    field.update({
      time: timeRef.current,
      stage,
      flow: pinnedScene === undefined ? window.scrollY * 0.000022 : 0,
      tunnel: pinnedScene === undefined ? window.scrollY * 0.00006 : 0,
      pixel: state.gl.getPixelRatio() * (narrow ? 1.1 : 1.32),
      opacity: pose.opacity,
      pulse: pulseRef.current,
      pointerX: hand.x * halfHeight * (size.width / size.height),
      pointerY: hand.y * halfHeight,
      pointerStrength: hand.strength,
      delta,
      instant: still,
    });

    // Shed work on slow GPUs: first resolution, then particles, never the motion.
    const budget = load.current;
    // Automated browsers render in software, where frame rate means nothing.
    if (!still && !budget.settled && !navigator.webdriver) {
      budget.frames += 1;
      if (budget.frames > 20) budget.spent += rawDelta;
      if (budget.frames === 110) {
        const fps = 90 / budget.spent;
        budget.frames = 0;
        budget.spent = 0;
        if (fps >= 42) {
          budget.settled = true;
        } else if (budget.step === 0) {
          budget.step = 1;
          setDpr(1);
        } else if (budget.step === 1) {
          budget.step = 2;
          field.thin(0.55);
          budget.settled = true;
        }
      }
    }
  });

  return (
    <>
      <ambientLight intensity={0.75} />
      <directionalLight position={[3, 5, 6]} intensity={2.3} />
      <pointLight position={[0, 0, 1.5]} intensity={3} color="#16ff00" />
      <group ref={group}>
        <points geometry={field.geometry} material={field.material} frustumCulled={false} />
        <Riders stroke={stroke} stageRef={stageRef} timeRef={timeRef} />
      </group>
    </>
  );
}

export default function SpiralCanvas({ pinnedScene, routeKey, still, poseOverride }: FieldProps) {
  return (
    <Canvas
      dpr={[1, 1.75]}
      frameloop={still ? "demand" : "always"}
      camera={{ fov: 40, position: [0, 0, 8], near: 0.1, far: 80 }}
      gl={{ alpha: true, antialias: false, powerPreference: "high-performance" }}
      style={{ pointerEvents: "none" }}
    >
      <Field pinnedScene={pinnedScene} routeKey={routeKey} still={still} poseOverride={poseOverride} />
    </Canvas>
  );
}
