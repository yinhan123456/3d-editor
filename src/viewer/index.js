import {
  useLayoutEffect,
  useRef,
  useState,
  useEffect,
  useContext,
  useImperativeHandle,
  forwardRef,
} from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { settingContext } from "../App";
import {
  localToZero,
  getBoundingBox,
  addSandTableTexture,
  removeUnusedDate,
  flip,
  mapEncode,
} from "./utils";
import { SCENE_NAME } from "../scene";
import { useSceneContext } from "../scene";

function addLight(scene) {
  const aLight = new THREE.AmbientLight(0xffffff, 0.8);
  scene.add(aLight);

  const dLight = new THREE.DirectionalLight(0xffffff, 0.5);
  dLight.position.set(1, 1, 1);
  scene.add(dLight);

  scene.add(new THREE.AxesHelper(5));
}

function addAxes(scene) {
  scene.add(new THREE.AxesHelper(5));
}
const renderer = new THREE.WebGLRenderer({
  alpha: true,
});

const ambientLight = new THREE.AmbientLight(0xffffff, 0);

let controller;

export const Viewer = forwardRef(function (props, ref) {
  const scene = useSceneContext();
  const { model = null } = props;
  const [size, setSize] = useState({ width: 600, height: 600 });
  const canvCtn = useRef(null);
  const { setting, camera } = useContext(settingContext);

  useEffect(() => {
    ambientLight.intensity = setting.light.ambientStrength;
    renderer.render(scene, camera);
  }, [setting]);

  useLayoutEffect(() => {
    if (
      canvCtn.current?.children.length &&
      Array.from(canvCtn.current.children).find((el) => el.nodeName.toLowerCase() === "canvas")
    ) {
      return;
    }

    // canvas插入
    renderer.setSize(size.width, size.height);
    canvCtn.current.append(renderer.domElement);

    // 灯光
    // addLight(scene);
    scene.add(ambientLight);
    // 坐标轴
    addAxes(scene);

    // 相机
    camera.position.set(20, 20, 20);
    scene.add(camera);

    // 控制器
    controller = new OrbitControls(camera, renderer.domElement);
    // controller.enabled = false
    // controller.addEventListener("change", () => {
    //   camera.dispatchEvent({ type: "change" });
    // });

    // 渲染
    function render() {
      renderer.render(scene, camera);
      requestAnimationFrame(render);
    }
    render();
  }, []);

  useEffect(() => {
    const g = new THREE.Group();
    g.name = SCENE_NAME.MAIN_BODY;
    if (model.length) {
      model.forEach((m) => g.add(m.scene));

      flip(g);
      mapEncode(g);
      localToZero(g);
      removeUnusedDate(g);

      // 判断是不是沙盘
      const boundingBox = getBoundingBox(g);
      const modelScale = boundingBox.max.clone().sub(boundingBox.min).length();
      if (modelScale > 1000) {
        addSandTableTexture(g);
        camera.near = -10000;
        camera.far = 10000;
        camera.updateProjectionMatrix();
      }

      scene.add(g);

      console.log("scene: ", scene);
    }

    return () => {
      scene.remove(g);
    };
  }, [model]);

  useImperativeHandle(
    ref,
    () => {
      return {
        size,
        toggleControllerDisable(disable) {
          if (controller) controller.enabled = !disable;
        },
        updateController() {
          if (controller) controller.update();
        },
        updateControllerTarget(targetPosition) {
          if (controller) controller.target.copy(targetPosition);
        },
      };
    },
    [size, controller]
  );

  return (
    <div
      style={{
        border: "10px solid green",
        width: size.width,
        height: size.height,
        position: "relative",
      }}
    >
      <div
        style={{
          position: "absolute",
          zIndex: -1,
          left: 0,
          width: "100%",
          height: "100%",
          // background: "purple",
        }}
      >
        {setting.tour.mapUrl ? (
          <img
            src={setting.tour.mapUrl}
            style={{ width: "100%", height: "100%", objectFit: "contain" }}
          />
        ) : null}
      </div>
      <div ref={canvCtn} style={{ width: "100%", height: "100%" }}></div>
    </div>
  );
});
