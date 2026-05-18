import * as THREE from 'three';

// 建立場景
const scene = new THREE.Scene();

// 建立相機與 pivotGroup
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.01, 2000);
const pivotGroup = new THREE.Group();
pivotGroup.add(camera);
scene.add(pivotGroup);

// 渲染器
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const canvas = renderer.domElement;

// 加光源
scene.add(new THREE.DirectionalLight(0xffffff, 1).position.set(5, 10, 7.5));
scene.add(new THREE.AmbientLight(0xffffff, 0.3));

// 建立地圖
const ground = generateGround(10, 10, 1);
scene.add(ground);
setupInitialCameraView(ground, camera);

// 建立角色（球體）
const character = new THREE.Mesh(
  new THREE.SphereGeometry(0.3, 16, 16),
  new THREE.MeshStandardMaterial({ color: 0xff7788 })
);
character.castShadow = true;
scene.add(character);
character.position.set(0, 2, 0);

// Raycaster 用來偵測地形高度 & 前方障礙物
const raycaster = new THREE.Raycaster();
const down = new THREE.Vector3(0, -1, 0);
const floatOffset = 0.5;
let lastGroundY = 0;

// 控制變數區
let isDragging = false;
let isPanning = false;
let panStart = { x: 0, y: 0 };
let previousMousePosition = { x: 0, y: 0 };
let inertia = { axis: new THREE.Vector3(), angle: 0 };
let isInertiaActive = false;
const friction = 0.9;
let startReturnQuat = new THREE.Quaternion();
let startReturnPos = new THREE.Vector3();
const defaultRotation = new THREE.Quaternion();
const defaultPosition = new THREE.Vector3(0, 0, 0);
let returnProgress = 0;
let isReturningToDefault = false;
let isRKeyHeld = false;
let rKeyPressedTime = 0;
const rKeyTriggerDelay = 2000;

let floatTime = 0;
const clock = new THREE.Clock();

const zoomSpeed = 0.5;
const minZoom = 3;
const maxZoom = 50;

const movement = { forward: false, backward: false, left: false, right: false };
const moveSpeed = 2;

canvas.addEventListener('contextmenu', (e) => e.preventDefault());
canvas.addEventListener('mousedown', (e) => {
  if (e.button === 0) {
    isDragging = true;
    previousMousePosition = { x: e.clientX, y: e.clientY };
  }
  if (e.button === 2) {
    isPanning = true;
    panStart = { x: e.clientX, y: e.clientY };
  }
});
canvas.addEventListener('mouseup', (e) => {
  if (e.button === 0) {
    isDragging = false;
    isInertiaActive = true;
  }
  if (e.button === 2) {
    isPanning = false;
  }
});
canvas.addEventListener('mousemove', (e) => {
  if (isDragging) {
    if (isReturningToDefault) isReturningToDefault = false;
    const dx = e.clientX - previousMousePosition.x;
    const dy = e.clientY - previousMousePosition.y;
    const angleX = dx * 0.005;
    const angleY = dy * 0.005;
    const up = new THREE.Vector3(0, 1, 0).applyQuaternion(pivotGroup.quaternion).normalize();
    const right = new THREE.Vector3(1, 0, 0).applyQuaternion(pivotGroup.quaternion).normalize();
    const qY = new THREE.Quaternion().setFromAxisAngle(up, -angleX);
    const qX = new THREE.Quaternion().setFromAxisAngle(right, -angleY);
    pivotGroup.quaternion.premultiply(qY).premultiply(qX);
    inertia.axis = up.clone().cross(right).normalize();
    inertia.angle = Math.sqrt(angleX ** 2 + angleY ** 2);
    previousMousePosition = { x: e.clientX, y: e.clientY };
  }
  if (isPanning) {
    const dx = e.clientX - panStart.x;
    const dy = e.clientY - panStart.y;
    const panSpeed = 0.01;
    const moveX = -dx * panSpeed;
    const moveY = dy * panSpeed;
    const forward = new THREE.Vector3();
    camera.getWorldDirection(forward);
    const right = forward.clone().cross(camera.up).normalize();
    const up = new THREE.Vector3().copy(camera.up).normalize();
    pivotGroup.position.add(right.multiplyScalar(moveX));
    pivotGroup.position.add(up.multiplyScalar(moveY));
    panStart = { x: e.clientX, y: e.clientY };
  }
});
canvas.addEventListener('wheel', (e) => {
  e.preventDefault();
  const direction = new THREE.Vector3().subVectors(pivotGroup.position, camera.position).normalize();
  const delta = e.deltaY > 0 ? 1 : -1;
  const distance = camera.position.distanceTo(pivotGroup.position);
  let newDistance = distance - delta * zoomSpeed;
  newDistance = Math.max(minZoom, Math.min(maxZoom, newDistance));
  camera.position.copy(pivotGroup.position.clone().add(direction.clone().multiplyScalar(-newDistance)));
});

window.addEventListener('keydown', (e) => {
  if (e.key === 'r' || e.key === 'R') {
    if (!isRKeyHeld) {
      isRKeyHeld = true;
      rKeyPressedTime = performance.now();
    }
  }
  if (e.key === 'w') movement.forward = true;
  if (e.key === 's') movement.backward = true;
  if (e.key === 'a') movement.left = true;
  if (e.key === 'd') movement.right = true;
});
window.addEventListener('keyup', (e) => {
  if (e.key === 'r' || e.key === 'R') {
    isRKeyHeld = false;
  }
  if (e.key === 'w') movement.forward = false;
  if (e.key === 's') movement.backward = false;
  if (e.key === 'a') movement.left = false;
  if (e.key === 'd') movement.right = false;
});

function animate() {
  requestAnimationFrame(animate);
  const delta = clock.getDelta();
  if (isInertiaActive && !isDragging) {
    if (inertia.angle > 0.0001) {
      const q = new THREE.Quaternion().setFromAxisAngle(inertia.axis, inertia.angle);
      pivotGroup.quaternion.premultiply(q);
      inertia.angle *= friction;
    } else {
      isInertiaActive = false;
    }
  }
  if (isRKeyHeld && !isReturningToDefault) {
    const now = performance.now();
    if (now - rKeyPressedTime >= rKeyTriggerDelay) {
      isRKeyHeld = false;
      isReturningToDefault = true;
      returnProgress = 0;
      startReturnQuat.copy(pivotGroup.quaternion);
      startReturnPos.copy(pivotGroup.position);
    }
  }
  if (isReturningToDefault) {
    if (returnProgress < 1.0) {
      returnProgress += 0.02;
      const t = 1 - Math.pow(1 - returnProgress, 4);
      pivotGroup.quaternion.copy(startReturnQuat).slerp(defaultRotation, t);
      pivotGroup.position.lerpVectors(startReturnPos, defaultPosition, t);
      if (returnProgress >= 1.0) {
        pivotGroup.quaternion.copy(defaultRotation);
        pivotGroup.position.copy(defaultPosition);
        isReturningToDefault = false;
      }
    }
  }

  updateFloatingCharacter(delta);
  updateCharacterMovement(delta);
  renderer.render(scene, camera);
}
animate();

function updateFloatingCharacter(deltaTime) {
  floatTime += deltaTime;
  const offsets = [
    new THREE.Vector3(0, 1, 0),
    new THREE.Vector3(0.2, 1, 0), new THREE.Vector3(-0.2, 1, 0),
    new THREE.Vector3(0, 1, 0.2), new THREE.Vector3(0, 1, -0.2),
  ];
  let maxGroundY = -Infinity;
  for (const offset of offsets) {
    raycaster.set(character.position.clone().add(offset), down);
    const intersects = raycaster.intersectObjects(ground.children, true);
    if (intersects.length > 0) {
      maxGroundY = Math.max(maxGroundY, intersects[0].point.y);
    }
  }
  if (maxGroundY > -Infinity) {
    const floatOffsetY = Math.sin(floatTime * 2 + character.position.x) * 0.05;
    let targetY = maxGroundY + floatOffset + floatOffsetY;
    const climbTrend = targetY - lastGroundY;
    if (climbTrend > 0.05) targetY -= 0.15;
    else if (climbTrend < -0.05) targetY += 0.1;
    character.position.y += (targetY - character.position.y) * 0.1;
    lastGroundY = maxGroundY;
  }
}

function updateCharacterMovement(deltaTime) {
  const direction = new THREE.Vector3();
  camera.getWorldDirection(direction);
  direction.y = 0;
  direction.normalize();
  const right = new THREE.Vector3().crossVectors(direction, new THREE.Vector3(0, 1, 0)).normalize();
  const moveVector = new THREE.Vector3();
  if (movement.forward) moveVector.add(direction);
  if (movement.backward) moveVector.sub(direction);
  if (movement.left) moveVector.sub(right);
  if (movement.right) moveVector.add(right);
  moveVector.normalize().multiplyScalar(moveSpeed * deltaTime);

  const futurePosition = character.position.clone().add(moveVector);
  const rayOrigin = futurePosition.clone().add(new THREE.Vector3(0, 1, 0));
  raycaster.set(rayOrigin, down);
  const hit = raycaster.intersectObjects(ground.children, true);
  if (hit.length > 0) {
    const dist = rayOrigin.y - hit[0].point.y;
    if (dist > 0.3) {
      character.position.add(moveVector);
    }
  }
}

function setupInitialCameraView(object, camera, distanceMultiplier = 2) {
  const box = new THREE.Box3().setFromObject(object);
  const size = new THREE.Vector3();
  box.getSize(size);
  const center = new THREE.Vector3();
  box.getCenter(center);
  const maxDim = Math.max(size.x, size.y, size.z);
  const distance = maxDim * distanceMultiplier;
  camera.position.set(distance, distance, distance);
  camera.lookAt(center);
}

function generateGround(rows = 10, cols = 10, size = 1) {
  const group = new THREE.Group();
  const geometry = new THREE.BoxGeometry(size, size, size);
  const halfW = (cols * size) / 2;
  const halfH = (rows * size) / 2;
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      const isDark = (i + j) % 2 === 0;
      const material = new THREE.MeshStandardMaterial({
        color: isDark ? 0x9fc5e8 : 0xcfe2f3,
      });
      const cube = new THREE.Mesh(geometry, material);
      let height = 0;
      if (i >= 3 && i <= 6 && j >= 3 && j <= 6) height = 1;
      if (i === 5 && j === 5) height = 2;
      cube.position.set(
        j * size - halfW + size / 2,
        height * size - 0.5,
        i * size - halfH + size / 2
      );
      group.add(cube);
    }
  }
  return group;
}
