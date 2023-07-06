import * as THREE from "three";

export function setDeepValue(obj, keyStr, value) {
  if (!/^\[object/i.test(Object.prototype.toString.call(obj)) || !keyStr) return;

  const keyArr = keyStr.split(".");
  if (keyArr.length === 1) {
    const number = parseFloat(value);
    obj[keyArr[0]] = isNaN(number) ? value : number;
  } else {
    setDeepValue(obj[keyArr.shift()], keyArr.join("."), value);
  }
}

export function getBox() {
  const boxGmt = new THREE.BoxGeometry(0.2, 0.5, 0.2);
  const boxMtl = new THREE.MeshPhongMaterial({
    color: 0xff0000,
    side: THREE.DoubleSide,
  });

  return new THREE.Mesh(boxGmt, boxMtl);
}

// 精确到小数点后3位
export function around(num) {
  return Math.round(num * 1000) / 1000;
}

export function delay(fn) {
  setTimeout(fn, 100);
}
