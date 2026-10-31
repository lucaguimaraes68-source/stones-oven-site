import * as THREE from 'three';
import { FontLoader } from 'three/addons/loaders/FontLoader.js';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const FONT = 'https://cdn.jsdelivr.net/npm/three@0.170.0/examples/fonts/droid/droid_serif_bold.typeface.json';
const SHADOW = { opacity: 0.25, y: -2.05, size: 24, blur: 2 };
const TOP = new THREE.Color(0xe8672a);
const BOTTOM = new THREE.Color(0xb32a06);

const host = document.getElementById('three');

// Extruded lettering, shaded orange at the top down to brick red at the bottom.
function buildLettering(font) {
  const group = new THREE.Group();
  const material = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.45, metalness: 0.05 });

  [['STONES', 0.55], ['OVEN', -1.25]].forEach(([word, y]) => {
    const geometry = new TextGeometry(word, {
      font, size: 1.35, depth: 0.55, curveSegments: 8,
      bevelEnabled: true, bevelThickness: 0.04, bevelSize: 0.025, bevelSegments: 3
    });
    geometry.center();
    const position = geometry.attributes.position;
    const colors = new Float32Array(position.count * 3);
    const color = new THREE.Color();
    for (let i = 0; i < position.count; i++) {
      color.lerpColors(BOTTOM, TOP, (position.getY(i) + 0.7) / 1.4);
      color.toArray(colors, i * 3);
    }
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.y = y;
    group.add(mesh);
  });

  const stone = new THREE.Mesh(
    new THREE.BoxGeometry(7.6, 0.22, 1.5),
    new THREE.MeshStandardMaterial({ color: 0xb9b0a3, roughness: 0.9 })
  );
  stone.position.y = -2.1;
  group.add(stone);
  return group;
}

// Soft contact shadow: a silhouette of the model seen from below, blurred when drawn.
function addShadow(scene, renderer, model) {
  const target = new THREE.WebGLRenderTarget(512, 512);
  const half = SHADOW.size / 2;
  const cam = new THREE.OrthographicCamera(-half, half, half, -half, 0, 50);
  cam.position.y = SHADOW.y - 0.2;
  cam.lookAt(0, SHADOW.y + 1, 0);

  const silhouette = new THREE.Scene();
  silhouette.overrideMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });
  silhouette.add(model);
  renderer.setRenderTarget(target);
  renderer.setClearColor(0xffffff, 1);
  renderer.clear();
  renderer.render(silhouette, cam);
  renderer.setRenderTarget(null);
  renderer.setClearColor(0x000000, 0);
  scene.add(model);

  const material = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    uniforms: {
      map: { value: target.texture },
      opacity: { value: SHADOW.opacity },
      radius: { value: SHADOW.blur / SHADOW.size / 2 }
    },
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: `
      uniform sampler2D map; uniform float opacity; uniform float radius; varying vec2 vUv;
      void main(){
        float sum = 0.0, weight = 0.0;
        for (float x = -4.0; x <= 4.0; x += 1.0) for (float y = -4.0; y <= 4.0; y += 1.0) {
          float w = exp(-(x * x + y * y) / 8.0);
          sum += (1.0 - texture2D(map, vUv + vec2(x, y) * radius / 4.0).r) * w;
          weight += w;
        }
        gl_FragColor = vec4(vec3(0.0), sum / weight * opacity);
      }`
  });
  const plane = new THREE.Mesh(new THREE.PlaneGeometry(SHADOW.size, SHADOW.size), material);
  plane.rotation.x = -Math.PI / 2;
  plane.scale.y = -1;
  plane.position.y = SHADOW.y - 0.12;
  scene.add(plane);
}

function start() {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.setClearColor(0x000000, 0);
  host.append(renderer.domElement);

  const scene = new THREE.Scene();
  scene.add(new THREE.AmbientLight(0xffffff, 1));
  scene.environment = new THREE.PMREMGenerator(renderer).fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.75;

  const camera = new THREE.PerspectiveCamera(80, 1, 0.1, 1000);
  camera.position.set(0, 2, 15);
  camera.zoom = 3.8;

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.autoRotate = true;
  controls.autoRotateSpeed = 0.5;
  controls.enableZoom = false;
  controls.enablePan = false;
  controls.enableDamping = true;

  const resize = () => {
    const { clientWidth: w, clientHeight: h } = host;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  };
  new ResizeObserver(resize).observe(host);
  resize();

  new FontLoader().load(FONT, font => addShadow(scene, renderer, buildLettering(font)));

  let visible = true;
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; }).observe(host);
  renderer.setAnimationLoop(() => {
    if (!visible) return;
    controls.update();
    renderer.render(scene, camera);
  });
}

// Wait until the section is close so three.js only loads when needed.
new IntersectionObserver(([e], io) => {
  if (e.isIntersecting) { io.disconnect(); start(); }
}, { rootMargin: '800px' }).observe(host);
