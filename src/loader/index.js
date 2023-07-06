import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
// import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader";
import { ColladaLoader } from "three/examples/jsm/loaders/ColladaLoader";
// import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";

function loadModel(url, filename, modifier) {
  return new Promise((resolve, reject) => {
    const type = /.*\.(.+?)$/.exec(filename);
    let loader;

    switch (type && type[1].toLowerCase()) {
      case "gltf":
      case "glb":
        loader = new GLTFLoader();

        // const draco = new DRACOLoader();
        // draco.setDecoderPath("/123/draco/");
        // draco.setDecoderConfig({ type: "js" });
        // draco.preload();
        // loader.setDRACOLoader(draco);
        break;
      case "dae":
        loader = new ColladaLoader();
        break;
      //   case "fbx":
      //     loader = new FBXLoader();
      //     break;
    }
    if (loader) {
      if (modifier) loader.manager.setURLModifier(modifier);
      loader.load(url, resolve, () => {}, reject);
    } else {
      reject(new Error("非glb、gltf、fbx"));
    }
  });
}

export default loadModel;
