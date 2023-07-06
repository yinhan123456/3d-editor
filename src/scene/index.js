import { createContext, useContext, useRef } from "react";
import * as THREE from "three";

const SceneContext = createContext();

export function Scene({ children }) {
  const scene = useRef(new THREE.Scene());
  return <SceneContext.Provider value={scene.current}>{children}</SceneContext.Provider>;
}

export function useSceneContext() {
  const scene = useContext(SceneContext);
  return scene;
}

export const SCENE_NAME = {
  MAIN_BODY: "$$MAIN_BODY$$",
};
