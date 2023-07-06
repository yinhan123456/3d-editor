import * as THREE from "three";
import { around } from "../../utils";

const floorInfo = {
  "2F": 2,
  "1F": 1,
  B1F: 0,
};

export function getBox() {
  const boxGmt = new THREE.BoxGeometry(0.2, 0.5, 0.2);
  const boxMtl = new THREE.MeshPhongMaterial({
    color: 0xff0000,
    side: THREE.DoubleSide,
  });

  return new THREE.Mesh(boxGmt, boxMtl);
}

// 获取相机
export function parseCameras(scene) {
  const cameraInfos = [];
  const rc = new THREE.Raycaster();

  scene.traverse((child) => {
    if (child.isCamera) {
      const quaternion = new THREE.Quaternion();
      const rotation = child.rotation.clone();
      rotation.y += Math.PI;
      quaternion.setFromEuler(rotation).normalize();

      const position = child.position.clone();

      rc.set(position, new THREE.Vector3(0, -1, 0));
      const insectObjs = rc.intersectObject(scene);
      let standing_position = [position.x, 0, position.z];
      if (insectObjs[0]) {
        standing_position = insectObjs[0].point.toArray().map((num) => around(num));
      }

      let floor_index = 0;
      if (typeof floorInfo[child.parent.name] === "number") {
        floor_index = floorInfo[child.parent.name];
      }

      cameraInfos.push({
        name: child.name,
        id: child.name,

        quaternion: {
          x: around(quaternion.x),
          y: around(quaternion.y),
          z: around(quaternion.z),
          w: around(quaternion.w),
        },
        position: [around(position.x), around(position.y), around(position.z)],
        standing_position,
        visible_nodes: [],
        accessible_nodes: [],
        // index: cameraInfos.length,
        floor_index,
        images: {
          up: `\/${child.name}\/cube_512\/u\/u_1_1.jpg`,
          down: `\/${child.name}\/cube_512\/d\/d_1_1.jpg`,
          left: `\/${child.name}\/cube_512\/l\/l_1_1.jpg`,
          right: `\/${child.name}\/cube_512\/r\/r_1_1.jpg`,
          front: `\/${child.name}\/cube_512\/f\/f_1_1.jpg`,
          back: `\/${child.name}\/cube_512\/b\/b_1_1.jpg`,
          tiles: [
            0,
            {
              level: 1,
              size: 1024,
              up: `\/${child.name}\/cube_1024\/u\/u.jpg`,
              down: `\/${child.name}\/cube_1024\/d\/d.jpg`,
              left: `\/${child.name}\/cube_1024\/l\/l.jpg`,
              right: `\/${child.name}\/cube_1024\/r\/r.jpg`,
              front: `\/${child.name}\/cube_1024\/f\/f.jpg`,
              back: `\/${child.name}\/cube_1024\/b\/b.jpg`,
            },
            {
              level: 2,
              size: 2048,
              up: `\/${child.name}\/cube_2048\/u\/u.jpg`,
              down: `\/${child.name}\/cube_2048\/d\/d.jpg`,
              left: `\/${child.name}\/cube_2048\/l\/l.jpg`,
              right: `\/${child.name}\/cube_2048\/r\/r.jpg`,
              front: `\/${child.name}\/cube_2048\/f\/f.jpg`,
              back: `\/${child.name}\/cube_2048\/b\/b.jpg`,
            },
            {
              level: 3,
              size: 4096,
              up: `\/${child.name}\/cube_4096\/u\/u.jpg`,
              down: `\/${child.name}\/cube_4096\/d\/d.jpg`,
              left: `\/${child.name}\/cube_4096\/l\/l.jpg`,
              right: `\/${child.name}\/cube_4096\/r\/r.jpg`,
              front: `\/${child.name}\/cube_4096\/f\/f.jpg`,
              back: `\/${child.name}\/cube_4096\/b\/b.jpg`,
            },
          ],
        },
      });
    }
  });

  // 重新排序添加index
  cameraInfos.sort((a, b) => {
    return parseInt(a.id.replace(/[^\d]/g, "")) > parseInt(b.id.replace(/[^\d]/g, "")) ? 1 : -1;
  });
  cameraInfos.forEach((info, index) => (info.index = index));

  return cameraInfos;
}

// 计算visible_nodes和accessible_nodes
export function computeVisibleNodes(cameraInfos = [], mainBody) {
  const rc = new THREE.Raycaster();

  rc.far = 1000;

  // 利用射线计算可视相机
  const totalCameraLen = cameraInfos.length;
  const source = new THREE.Vector3();
  const target = new THREE.Vector3();
  const direction = new THREE.Vector3();
  let distance = 0;
  for (let sourceIndex = 0; sourceIndex < totalCameraLen; sourceIndex++) {
    cameraInfos[sourceIndex].visible_nodes = [];
    cameraInfos[sourceIndex].accessible_nodes = [];
    source.fromArray(cameraInfos[sourceIndex].position);

    for (let targetIndex = 0; targetIndex < totalCameraLen; targetIndex++) {
      if (targetIndex === sourceIndex) continue;

      target.fromArray(cameraInfos[targetIndex].position);
      direction.copy(target.clone().sub(source).normalize());
      rc.set(source, direction);

      const intersects = rc.intersectObject(mainBody, true);
      distance = target.clone().sub(source).length();
      if (!intersects[0] || intersects[0].distance > distance) {
        cameraInfos[sourceIndex].visible_nodes.push(cameraInfos[targetIndex].index);
        cameraInfos[sourceIndex].accessible_nodes.push(cameraInfos[targetIndex].index);
      }
    }
  }
}

export function getVisbileNodeMesh(cameraInfos = []) {
  const g = new THREE.Group();

  const box = getBox();
  cameraInfos.forEach((sourceCamera) => {
    const cameraBox = box.clone();
    cameraBox.position.fromArray(sourceCamera.position);
    cameraBox.name = `camera-${sourceCamera.name}`;
    g.add(cameraBox);

    sourceCamera.visible_nodes.forEach((targetIndex) => {
      const targetCamera = cameraInfos[targetIndex];
      const targetPosition = new THREE.Vector3().fromArray(targetCamera.position);
      const line = targetPosition.clone().sub(cameraBox.position.clone());

      const arrow = new THREE.ArrowHelper(line.clone().normalize(), cameraBox.position);
      g.add(arrow);
    });
  });

  return g;
}

export function computeMapMatrix(containerSize, mapRatio, camera) {
  const ctnRatio = containerSize.width / containerSize.height;

  let mapWidth = containerSize.width;
  let mapHeight = containerSize.height;
  if (mapRatio > ctnRatio) mapHeight = containerSize.width / mapRatio;
  else if (mapRatio < ctnRatio) mapWidth = containerSize.height * mapRatio;

  const mapCamera = camera.clone();
  mapCamera.left = camera.left / camera.zoom;
  mapCamera.right = camera.right / camera.zoom;
  mapCamera.top = camera.top / camera.zoom;
  mapCamera.bottom = camera.bottom / camera.zoom;
  mapCamera.zoom = 1;
  mapCamera.updateProjectionMatrix();

  return {
    matrixWorldInverse: mapCamera.matrixWorldInverse.toArray(),
    projectionMatrix: mapCamera.projectionMatrix.toArray(),
  };
}

export function isEqual(obj1, obj2) {
  const keys = Object.keys(obj1);
  if (keys.length !== Object.keys(obj2).length) return false;

  for (let i = 0; i < keys.length; i++) {
    if (obj1[keys[i]] !== obj2[keys[i]]) return false;
  }
  return true;
}

export function saveAsString(text, filename) {
  save(new Blob([text], { type: "text/plain" }), filename);
}
export function saveAsArrayBuffer(buffer, filename) {
  save(new Blob([buffer], { type: "application/octet-stream" }), filename);
}
export function save(blob, filename) {
  const link = document.createElement("a");
  document.body.append(link);
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
}

// 添加楼栋标识
export function addFloorIdentity(model) {
  if (!model) return;

  model.traverse((child) => {
    if (child.isMesh) {
      if (typeof floorInfo[child.parent.name] === "number") {
        child.userData.floorIndex = floorInfo[child.parent.name];
      }
    }
  });
}
