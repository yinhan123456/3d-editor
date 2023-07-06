import { useRef } from "react";
import * as THREE from "three";

function useCamera() {
  const camera = useRef(new THREE.OrthographicCamera(-50, 50, 50, -50, -50, 50));

  return [camera.current];
}

export { useCamera };
