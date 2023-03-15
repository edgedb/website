import * as THREE from "three";
import {GLTFLoader} from "three/examples/jsm/loaders/GLTFLoader";
import {FontLoader} from "three/examples/jsm/loaders/FontLoader";
import {TextGeometry} from "three/examples/jsm/geometries/TextGeometry";

import toonGradient from "./textures/gradients/54.png";
import cloudGradient from "./textures/gradients/4.png";
import lightsTexture from "./textures/noise_16_gradient.png";
import textTexture from "./textures/matcaps/7.png";
// @ts-ignore
import allModels from "./models/v1_db_optimized.glb";
// @ts-ignore
import edgedbJsonFont from "./fonts/EdgeDB_Bold_stripped.jsonfont";

// Number of pixels in 2d screen space corresponding
// to 1 length unit in 3d space
const unitRatio = 100;

const cameraFov = 35;

const parameters = {
  materialColor: "#F5F5F5",
};

// 3d coordinate system:
//          y  -z
//          | /
//          |/
//  -x -----+----- x
//         /|
//        / |
//       z  -y
// (z towards screen, -z into screen)

// - Camera z is adjusted based on screen size to maintain `unitRatio`
// - Camera y is adjusted based on scroll position such that y = 0 in 2d screen
//   space corresponds to y = 0 in 3d space

// https://github.com/mrdoob/three.js/issues/1239
// https://discourse.threejs.org/t/functions-to-calculate-the-visible-width-height-at-a-given-z-depth-from-a-perspective-camera/269
const screenHeightToCameraZ =
  1 / unitRatio / (2 * Math.tan(cameraFov * (Math.PI / 360)));

// Setup loaders, textures, materials, etc.

const gltfLoader = new GLTFLoader();
const textureLoader = new THREE.TextureLoader();
const fontLoader = new FontLoader();

const gradientTexture = textureLoader.load(toonGradient.src);
gradientTexture.magFilter = THREE.NearestFilter;
// Light grey material
const baseMaterial = new THREE.MeshToonMaterial({
  color: parameters.materialColor,
  gradientMap: gradientTexture,
});
// Darker inside material
const insideMaterial = new THREE.MeshToonMaterial({
  color: "#E5E5E5",
  gradientMap: gradientTexture,
});

const animTexture = textureLoader.load(lightsTexture.src);
animTexture.wrapS = THREE.RepeatWrapping;
animTexture.wrapT = THREE.RepeatWrapping;
animTexture.offset.y = 0;
// Animated lights material
const lightsMaterial = new THREE.MeshToonMaterial({
  color: "#d9d9d9",
  emissive: "#ffffff",
  emissiveMap: animTexture,
  alphaMap: animTexture,
  transparent: true,
});
// Static lights material
const staticLightsMaterial = new THREE.MeshToonMaterial({
  color: "#d9d9d9",
  emissive: "#ffffff",
  emissiveIntensity: 15.0,
});

const matcapTexture = textureLoader.load(textTexture.src);
const textMaterial = new THREE.MeshMatcapMaterial({
  matcap: matcapTexture,
  flatShading: false,
});

const cloudTexture = textureLoader.load(cloudGradient.src);
cloudTexture.magFilter = THREE.NearestFilter;
const cloudMaterial = new THREE.MeshToonMaterial({
  color: parameters.materialColor,
  gradientMap: cloudTexture,
});

function clamp(val: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, val));
}

let canFallback = true;

setTimeout(() => (canFallback = false), 10_000);

export class WebGlModelController {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private canvasSize = {width: 0, height: 0};
  screenSize = {width: window.innerWidth, height: window.innerHeight};

  private model?: WebGlModel;

  visible: boolean = false;

  private lastTimestamp = 0;
  private animationFrameRef: number | null = null;

  stickyContainer = {top: 0, height: 0, width: 0};

  private canvasResizeObserver: ResizeObserver;
  private screenResizeListener: () => void;
  private mouseMoveListener?: (e: MouseEvent) => void;
  private documentResizeObserver?: ResizeObserver;
  private scrollListener?: () => void;

  constructor(
    modelId: string,
    canvas: HTMLCanvasElement,
    onLoaded: () => void,
    private onFallback: () => void,
    stickyContainer?: HTMLElement
  ) {
    this.scene = new THREE.Scene();

    this.camera = new THREE.PerspectiveCamera(cameraFov, 1, 0.1, 100);
    this.camera.position.z = 5;
    this.scene.add(this.camera);

    this.renderer = new THREE.WebGLRenderer({
      canvas: canvas,
      antialias: true,
      alpha: true,
    });
    this.renderer.setSize(
      this.canvasSize.width,
      this.canvasSize.height,
      false
    );
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    this.tick = this.tick.bind(this);

    models[modelId].loadModel(this).then((model) => {
      this.model = model;
      this.model.updatePosition?.(this);
      this.needsUpdate();
      onLoaded();
    });

    this.canvasResizeObserver = new ResizeObserver((entries) => {
      this.canvasSize = {
        width: entries[0].contentRect.width,
        height: entries[0].contentRect.height,
      };
      this.camera.aspect = this.canvasSize.width / this.canvasSize.height;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(
        this.canvasSize.width,
        this.canvasSize.height,
        false
      );
      this.needsUpdate();
    });
    this.canvasResizeObserver.observe(canvas);

    this.screenResizeListener = () => {
      this.screenSize = {width: window.innerWidth, height: window.innerHeight};
    };
    window.addEventListener("resize", this.screenResizeListener);

    if (!("ontouchstart" in document.documentElement)) {
      this.mouseMoveListener = (e: MouseEvent) => {
        this.camera.position.x =
          ((e.clientX / this.screenSize.width) * 2 - 1) * 0.1;
        this.camera.position.y =
          ((e.clientY / this.screenSize.height) * 2 - 1) * -0.1;

        this.needsUpdate();
      };
      window.addEventListener("mousemove", this.mouseMoveListener);
    }

    if (stickyContainer) {
      let top = 0;
      this.documentResizeObserver = new ResizeObserver(() => {
        const rect = stickyContainer.getBoundingClientRect();
        top = rect.top + window.scrollY;

        this.stickyContainer.height = rect.height;
        this.stickyContainer.width = rect.width;
        this.stickyContainer.top = rect.top;
        this.model?.updatePosition?.(this);
      });
      this.documentResizeObserver.observe(document.documentElement);

      this.scrollListener = () => {
        this.stickyContainer.top = top - window.scrollY;
        this.model?.updatePosition?.(this);
      };
      window.addEventListener("scroll", this.scrollListener);
    }
  }

  setVisibility(visible: boolean) {
    this.visible = visible;
    this.needsUpdate();
  }

  private needsUpdate() {
    if (this.visible && this.animationFrameRef === null) {
      this.lastTimestamp = performance.now();
      this.animationFrameRef = requestAnimationFrame(this.tick);
    }
  }

  private consecutiveSlowFrames = 0;
  private tick(timestamp: number) {
    const deltaTime = (timestamp - this.lastTimestamp) * 0.001;
    this.lastTimestamp = timestamp;

    if (canFallback) {
      if (deltaTime > 0.033) {
        // 30 fps
        this.consecutiveSlowFrames += 1;
      } else {
        this.consecutiveSlowFrames = 0;
      }

      if (this.consecutiveSlowFrames > 30) {
        this.triggerFallback();
        return;
      }
    }

    this.model?.tick?.(this, deltaTime);

    this.renderer.render(this.scene, this.camera);

    if (this.visible && this.model?.hasAnimation) {
      this.animationFrameRef = requestAnimationFrame(this.tick);
    } else {
      this.animationFrameRef = null;
    }
  }

  private triggerFallback() {
    this.cleanup();
    this.renderer.clear();
    this.onFallback();
  }

  cleanup() {
    window.removeEventListener("resize", this.screenResizeListener);
    this.canvasResizeObserver.disconnect();
    this.documentResizeObserver?.disconnect();
    if (this.mouseMoveListener) {
      window.removeEventListener("mousemove", this.mouseMoveListener);
    }
    if (this.scrollListener) {
      window.removeEventListener("scroll", this.scrollListener);
    }
    if (this.animationFrameRef) {
      cancelAnimationFrame(this.animationFrameRef);
    }
  }
}

interface Position {
  top: number;
  left: number;
  height: number;
  width: number;
}

interface WebGlModel {
  model: THREE.Object3D;
  hasAnimation: boolean;
  updatePosition?(controller: WebGlModelController): void;
  tick?(controller: WebGlModelController, deltaTime: number): void;
}

const loadMainModels = new Promise<{
  headerModelGroup: THREE.Group;
  internalsModelGroup: THREE.Group;
  insideModelGroup: THREE.Group;
  headerLightsRings: THREE.Mesh[];
  internalsLightsRings: THREE.Mesh[];
  internalsEndCaps: THREE.Mesh[];
  insidesHalfs: THREE.Group[];
}>((resolve, reject) => {
  const headerModelGroup = new THREE.Group();
  const internalsModelGroup = new THREE.Group();
  const insideModelGroup = new THREE.Group();
  const headerLightsRings: THREE.Mesh[] = [];
  const internalsLightsRings: THREE.Mesh[] = [];
  const internalsEndCaps: THREE.Mesh[] = [];
  const insidesHalfs: THREE.Group[] = [];

  internalsModelGroup.scale.setScalar(1.2);

  gltfLoader.load(
    allModels,
    (gltf) => {
      const meshes: {[key: string]: THREE.Mesh} = {};
      for (const child of gltf.scene.children) {
        meshes[child.name] = child as THREE.Mesh;
      }

      // caps / ring
      const capTop = meshes["2p_mv_top_cap"].clone();
      capTop.material = baseMaterial;
      const midRing = meshes["1p_mid_ring"].clone();
      midRing.material = baseMaterial;
      const capBottom = capTop.clone();
      capBottom.scale.y = -1;

      internalsEndCaps.push(capTop, capBottom);

      // light rings
      const lightsMid = meshes["3p_dots"].clone();
      lightsMid.material = lightsMaterial;
      const lightsTop = lightsMid.clone();
      lightsTop.position.y = 1.38;
      const lightsBottom = lightsMid.clone();
      lightsBottom.position.y = -1.38;

      // insides
      const insidesUpper = new THREE.Group();

      const insidesMain = meshes["2p_mv_main_int"].clone();
      insidesMain.material = insideMaterial;
      const insidesLights = meshes["2p_mv_int_lights"].clone();
      insidesLights.material = staticLightsMaterial;

      const insidesMainMirror = insidesMain.clone();
      insidesMainMirror.rotateY(Math.PI);
      const insidesLightsMirror = insidesLights.clone();
      insidesLightsMirror.rotateOnWorldAxis(
        new THREE.Vector3(0, 1, 0),
        Math.PI
      );

      insidesUpper.add(
        insidesMain,
        insidesLights,
        insidesMainMirror,
        insidesLightsMirror
      );

      const insidesBattery = meshes["4p_mv_battery"].clone();
      insidesBattery.material = insideMaterial;
      const insidesFrame = meshes["4p_mv_frame"].clone();
      insidesFrame.material = baseMaterial;
      const insidesBattLight = meshes["4p_mv_int_lights"].clone();
      insidesBattLight.material = staticLightsMaterial;

      const strutGroup = new THREE.Group();
      strutGroup.add(insidesBattery, insidesFrame, insidesBattLight);

      insidesUpper.add(strutGroup);
      for (let i = 1; i < 4; i++) {
        const strutGroupRot = strutGroup.clone();
        strutGroupRot.rotation.y = i * (Math.PI / 2);
        insidesUpper.add(strutGroupRot);
      }

      const insidesLower = insidesUpper.clone();
      insidesLower.scale.y = -1;

      insideModelGroup.add(insidesUpper, insidesLower);
      insidesHalfs.push(insidesUpper, insidesLower);
      internalsLightsRings.push(lightsTop, lightsMid, lightsBottom);
      internalsModelGroup.add(
        capTop,
        midRing,
        capBottom,
        insideModelGroup,
        ...internalsLightsRings
      );

      // header model
      const headerCapTop = capTop.clone();
      const headerLightsTop = lightsTop.clone();
      const headerMidRing = midRing.clone();
      const headerLightsMid = lightsMid.clone();
      const headerCapBottom = capBottom.clone();
      const headerLightsBottom = lightsBottom.clone();

      headerCapTop.position.y = -0.68;
      headerLightsTop.position.y = 0.68;
      headerCapBottom.position.y = 0.68;
      headerLightsBottom.position.y = -0.68;

      headerLightsRings.push(
        headerLightsTop,
        headerLightsMid,
        headerLightsBottom
      );
      headerModelGroup.add(
        headerCapTop,
        headerMidRing,
        headerCapBottom,
        ...headerLightsRings
      );

      resolve({
        headerModelGroup,
        internalsModelGroup,
        insideModelGroup,
        headerLightsRings,
        internalsLightsRings,
        internalsEndCaps,
        insidesHalfs,
      });
    },
    undefined,
    reject
  );
});

const directionalLight = new THREE.DirectionalLight("#ffffff", 1.02);
directionalLight.position.set(1, 1, 1);

class HeaderModel implements WebGlModel {
  hasAnimation = true;

  constructor(public model: THREE.Group, private lightsRings: THREE.Mesh[]) {}

  static async loadModel(controller: WebGlModelController) {
    const {headerModelGroup, headerLightsRings} = await loadMainModels;

    controller.scene.add(headerModelGroup).add(directionalLight.clone());

    return new HeaderModel(headerModelGroup, headerLightsRings);
  }

  tick(webgl: WebGlModelController, deltaTime: number) {
    animTexture.offset.y += 0.05 * deltaTime;

    this.lightsRings[0].rotation.y += deltaTime * 0.12;
    this.lightsRings[2].rotation.y -= deltaTime * 0.1;
    this.lightsRings[1].rotation.y += deltaTime * 0.07;
  }
}

const collapsedRatio = 1.22;
const expandedRatio = 1.89;
class InternalsModel implements WebGlModel {
  hasAnimation = true;

  constructor(
    public model: THREE.Group,
    private lightsRings: THREE.Mesh[],
    private insideModel: THREE.Group,
    private endCaps: THREE.Mesh[],
    private insideHalfs: THREE.Group[]
  ) {}

  static async loadModel(controller: WebGlModelController) {
    const {
      internalsModelGroup,
      internalsLightsRings,
      insideModelGroup,
      internalsEndCaps,
      insidesHalfs,
    } = await loadMainModels;

    internalsModelGroup.scale.setScalar(0.65);

    controller.scene.add(internalsModelGroup).add(directionalLight.clone());

    return new InternalsModel(
      internalsModelGroup,
      internalsLightsRings,
      insideModelGroup,
      internalsEndCaps,
      insidesHalfs
    );
  }

  updatePosition(webgl: WebGlModelController) {
    const container = webgl.stickyContainer;
    const min =
      (webgl.screenSize.height - container.width * collapsedRatio) / 2;
    const max =
      webgl.screenSize.height -
      (webgl.screenSize.height - container.width * expandedRatio) / 2 -
      container.height;

    const progress = 1 - clamp((container.top - min) / (max - min), 0, 1);

    this.endCaps[0].position.y = progress * -0.68;
    this.lightsRings[0].position.y = 1.38 - progress * 0.7;
    this.insideHalfs[0].position.y = progress * -0.34;
    this.endCaps[1].position.y = progress * 0.68;
    this.lightsRings[2].position.y = -1.38 + progress * 0.7;
    this.insideHalfs[1].position.y = progress * 0.34;
  }

  tick(webgl: WebGlModelController, deltaTime: number) {
    animTexture.offset.y += 0.05 * deltaTime;

    this.lightsRings[0].rotation.y -= deltaTime * 0.12;
    this.lightsRings[2].rotation.y += deltaTime * 0.1;
    this.lightsRings[1].rotation.y -= deltaTime * 0.07;
    this.insideModel.rotation.y += deltaTime * 0.05;
  }
}

class EdgeqlTextModel implements WebGlModel {
  hasAnimation = false;

  constructor(public model: THREE.Mesh) {}

  static async loadModel(controller: WebGlModelController) {
    const font = await fontLoader.loadAsync(edgedbJsonFont);

    const textGeometry = new TextGeometry("edgeql", {
      font: font,
      size: 0.85,
      height: 0.2,
      curveSegments: 5,
      bevelEnabled: true,
      bevelThickness: 0.02,
      bevelSize: 0.02,
      bevelOffset: 0,
      bevelSegments: 4,
    });

    const scale = 1 / 0.88;
    textGeometry.scale(scale, scale, scale);

    textGeometry.center();

    textGeometry.translate(0, -0.05, 0);

    const model = new THREE.Mesh(textGeometry, textMaterial);

    controller.scene.add(model);
    controller.camera.fov = 17;
    controller.camera.updateProjectionMatrix();

    return new EdgeqlTextModel(model);
  }
}

class CloudModel implements WebGlModel {
  hasAnimation = false;

  constructor(public model: THREE.Group) {}

  static async loadModel(controller: WebGlModelController) {
    const sphere = new THREE.Mesh(
      new THREE.SphereGeometry(0.5, 32, 32),
      cloudMaterial
    );

    const sphere2 = sphere.clone();
    const sphere3 = sphere.clone();
    const sphere4 = sphere.clone();
    const sphere5 = sphere.clone();
    const sphere6 = sphere.clone();

    sphere.position.set(0.68, -0.2, 0);

    sphere2.scale.set(1.2, 1.2, 1.2);
    sphere2.position.set(0.05, 0.2, 0);

    sphere3.scale.set(0.8, 0.8, 0.8);
    sphere3.position.set(-0.65, 0, 0);

    sphere4.scale.set(0.6, 0.6, 0.6);
    sphere4.position.set(0.05, -0.4, -0.1);

    sphere5.scale.set(0.8, 0.8, 0.8);
    sphere5.position.set(-0.45, -0.3, -0.3);

    sphere6.scale.set(0.55, 0.55, 0.55);
    sphere6.position.set(-0.95, -0.4, -0.3);

    const cloud = new THREE.Group();
    cloud.add(sphere, sphere2, sphere3, sphere4, sphere5, sphere6);

    cloud.scale.setScalar(1.63);
    cloud.position.set(-0.05, -0.1, 0);

    controller.scene.add(cloud).add(directionalLight.clone());

    return new CloudModel(cloud);
  }
}

const models: {
  [key: string]: {
    loadModel: (controller: WebGlModelController) => Promise<WebGlModel>;
  };
} = {
  header: HeaderModel,
  edgeql: EdgeqlTextModel,
  cloud: CloudModel,
  underTheHood: InternalsModel,
};
