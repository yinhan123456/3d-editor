import * as THREE from "three";

export function getSize(imgUrl) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = imgUrl;
    img.onload = () => {
      resolve({ width: img.width, height: img.height });
    };
    img.onerror = (error) => {
      reject(error);
    };
  });
}

// 将局部坐标系归零
export function localToZero(obj) {
  if (obj.isCamera) return;

  const m = obj.matrixWorld.clone();
  const mi = m.clone().invert();
  obj.applyMatrix4(mi);
  obj.updateWorldMatrix(false, true);

  if (obj.geometry) {
    obj.geometry.applyMatrix4(m);
  }

  obj.children.forEach((child) => {
    child.applyMatrix4(m);
    child.updateWorldMatrix(false, true);
    localToZero(child);
  });
}

// 清楚多余数据
export function removeUnusedDate(model, isSandTable) {
  if (!model) return;
  model.traverse((item) => {
    if (item.isMesh) {
      // 只保留position、uv、normal信息
      const reserve = ["position", "uv", "normal"];
      // const reserve = ["position", "uv", "normal", "uv2"];
      const gmt = item.geometry;
      for (const attr in gmt.attributes) {
        if (!reserve.includes(attr)) {
          gmt.deleteAttribute(attr);
        }
      }
    }
  });
}

// 沙盘替换材质
const texture = new THREE.Texture();
const image = new Image();
image.onload = () => {
  texture.image = image;
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.minFilter = THREE.LinearFilter;
  texture.needsUpdate = true;
  image.onload = () => {};
};
image.src = "data:image/webp;base64,UklGRiIAAABXRUJQVlA4IBYAAAAwAQCdASoBAAEADsD+JaQAA3AAAAAA";
export function addSandTableTexture(model) {
  if (!model) return;
  model.traverse((child) => {
    if (child.isMesh) {
      child.material.map = texture;
    }
  });
}

// 法线翻转
export function flip(model) {
  if (!model) return;
  model.traverse((child) => {
    if (child.isMesh) {
      const needToFlip = child.scale.x * child.scale.y * child.scale.z < 0;
      if (needToFlip && child.geometry.index) {
        const index = child.geometry.index.array;
        for (let i = 0, il = index.length / 3; i < il; i++) {
          let x = index[i * 3];
          index[i * 3] = index[i * 3 + 2];
          index[i * 3 + 2] = x;
        }
        child.geometry.index.needsUpdate = true;
      }
    }
  });
}

export function getBoundingBox(model) {
  if (!model) return;
  const boundingBox = new THREE.Box3();
  model.traverse((child) => {
    if (child.isMesh) {
      boundingBox.expandByObject(child);
    }
  });
  return boundingBox;
}

export function getLabelConfig(model) {
  if (!model) return;

  const labels = [];
  model.traverse((child) => {
    if (child.isMesh && /^hospot_/.exec(child.name)) {
      labels.push({
        name: child.name,
        id: child.name,
        position: {
          x: child.position.x,
          y: child.position.y,
          z: child.position.z,
        },
        mode: "Panorama",
        type: "banner",
        // visible_node: [2],
        action: {
          type: "toPano",
          state: {
            // panoIndex: 4,
          },
        },
        // visiblePanos: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
        notActiveImmediate: false,
      });
    }
  });

  return labels;
}

export function mapEncode(model) {
  if (!model) return;
  model.traverse((child) => {
    if (child.isMesh && child.material.map) {
      child.material.map.encoding = THREE.SRGBColorSpace;
      child.material.map.colorSpace = THREE.SRGBColorSpace;
    }
  });
}
