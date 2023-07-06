import {
  Form,
  Slider,
  Collapse,
  List,
  Input,
  Divider,
  Checkbox,
  Button,
  Drawer,
  InputNumber,
  Radio,
  Spin,
} from "antd";
import { settingContext } from "../../App";
import { SCENE_NAME } from "../../scene";
import { useContext, useImperativeHandle, useState, forwardRef, useEffect } from "react";
import {
  parseCameras,
  computeVisibleNodes,
  getVisbileNodeMesh,
  saveAsArrayBuffer,
  saveAsString,
  addFloorIdentity,
} from "./utils";
import { UploadImg } from "../../upload/uploadImg";
import * as THREE from "three";
import { getSize } from "../../viewer/utils";
import { delay } from "../../utils";
import { GLTFExporter } from "three/examples/jsm/exporters/GLTFExporter";
import { useSceneContext } from "../../scene";

const defaultTourConfig = {
  base_url: "",
  modelAsync: true,
  initial: {
    mode: "Panorama",
    panoIndex: 0,
    fov: 73.74,
    longitude: 0,
    latitude: 0,
  },
  model: {
    file: "/model.glb",
  },
  patternCode: "",
  observers: [],
  label: {
    visible: true,
    list: [],
  },
};

const DIR_NZ = new THREE.Vector3(0, 0, -1);
const DIR_Y = new THREE.Vector3(0, 1, 0);

function useDebouceEffect(fn, deps) {
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fn();
    }, 100);
    return () => {
      clearTimeout(timeoutId);
    };
  }, deps);
}

export const TourSetting = forwardRef(function (props, ref) {
  const scene = useSceneContext();
  const { camera, setting, updateSetting } = useContext(settingContext);
  const [open, setOpen] = useState(false);
  const [cameraInfos, setCameraInfos] = useState([]);
  const [tourConfig, setTourConfig] = useState(defaultTourConfig);
  const [showCamera, setShowCamera] = useState(false);
  const [mapSize, setMapSize] = useState({ width: 1, height: 1 });
  const [mapForm, setMapFrom] = useState({
    offsetX: 0,
    offsetZ: 0,
    scale: 1,
    rotation: 0,
  });
  const [mapUrl, setMapUrl] = useState("");
  const [textureSize, setTextureSize] = useState(1024);
  const [modelType, setModelType] = useState("glb");
  const [loading, setLoading] = useState(false);

  // 对外暴露参数、方法
  useImperativeHandle(
    ref,
    () => {
      return {
        open: () => {
          setOpen(true);
        },
      };
    },
    []
  );
  useEffect(() => props?.updateMapUrl(mapUrl), [mapUrl]);
  useEffect(() => props?.updateMapSize(mapSize), [mapSize]);

  // 关闭侧边栏时
  const onClose = () => {
    setOpen(false);
  };

  // 点击解析相机
  const handleParseCameras = (e) => {
    e.stopPropagation();

    const mainBody = scene.getObjectByName(SCENE_NAME.MAIN_BODY);

    if (!mainBody) return;

    setLoading(true);
    setCameraInfos(parseCameras(mainBody));
    setLoading(false);
  };

  // 计算可前进到的相机
  const handleCameraCollision = (e) => {
    e.stopPropagation();

    const mainBody = scene.getObjectByName(SCENE_NAME.MAIN_BODY);

    if (!mainBody) return;

    setLoading(true);
    delay(() => {
      computeVisibleNodes(cameraInfos, mainBody);
      setCameraInfos([...cameraInfos]);
      setLoading(false);
    });
  };

  // 相机位置显示隐藏
  useEffect(() => {
    if (!showCamera) return;

    const cameraMesh = getVisbileNodeMesh(cameraInfos);
    scene.add(cameraMesh);

    return () => scene.remove(cameraMesh);
  }, [showCamera, cameraInfos]);

  // 相机位置解析后
  useEffect(() => {
    tourConfig.observers = cameraInfos;
    setTourConfig({ ...tourConfig });
  }, [cameraInfos]);

  // 点击模型下载按钮时
  const handleModelDownload = (e) => {
    const binary = modelType === "glb";

    const gExport = new GLTFExporter();
    const outputModel = scene.getObjectByName(SCENE_NAME.MAIN_BODY);

    // addFloorIdentity(outputModel)
    toggleCamera(outputModel, false);
    setLoading(true);
    gExport.parse(
      outputModel,
      (result) => {
        if (result instanceof ArrayBuffer) saveAsArrayBuffer(result, `model.glb`);
        else saveAsString(JSON.stringify(result), `model.gltf`);

        toggleCamera(outputModel, false);
        setLoading(false);
      },
      (error) => {
        console.error(error);
        toggleCamera(outputModel, false);
        setLoading(false);
      },
      { binary, maxTextureSize: textureSize, onlyVisible: true }
    );

    // 隐藏/显示相机
    function toggleCamera(node, isVis) {
      node.traverse((child) => {
        if (child.isCamera) {
          child.visible = isVis;
        }
      });
    }
  };

  // 点击地图参数计算时
  const handleMapMatrixCompute = () => {
    console.log(setting.tour.computeMapMatrix());
  };

  // useLayoutEffect(() => {
  //   function handleCameraChange() {
  //     const current = {
  //       offsetX: camera.position.x,
  //       offsetZ: camera.position.z,
  //       zoom: camera.zoom,
  //       rotation: camera.rotation.y,
  //     };

  //     if (!isEqual(current, mapForm)) {
  //       setMapFrom(current);
  //       form?.setFieldsValue(current);
  //       // setMapFromKey(i)
  //     }
  //   }
  //   camera.addEventListener("change", handleCameraChange);
  //   return () => camera.removeEventListener("change", handleCameraChange);
  // }, [form]);

  // 地图参数变更后
  const handleMapFromChange = (valObj) => {
    const data = { ...mapForm, ...valObj };
    const { offsetX, offsetZ, scale, rotation } = data;

    camera.position.x = offsetX;
    camera.position.z = offsetZ;
    camera.zoom = scale;
    camera.up = DIR_NZ.clone().applyAxisAngle(DIR_Y, -rotation);
    camera.updateMatrix();
    camera.updateProjectionMatrix();
    setting.tour.updateControllerTarget(new THREE.Vector3(offsetX, 0, offsetZ));
    setting.tour.updateController();

    setMapFrom(data);
  };
  useDebouceEffect(() => {
    if (!tourConfig) return;
    if (!tourConfig.modeSetting) tourConfig.modeSetting = {};

    let { left, right, top, bottom } = camera;
    const mapRatio = mapSize.width / mapSize.height;
    const cameraWidth = right - left;
    const cameraHeight = top - bottom;
    const cameraRatio = cameraWidth / cameraHeight;

    if (mapRatio > cameraRatio) {
      top -= (cameraHeight - cameraWidth / mapRatio) / 2;
      bottom += (cameraHeight - cameraWidth / mapRatio) / 2;
    } else if (mapRatio < cameraRatio) {
      right -= (cameraWidth - cameraHeight * mapRatio) / 2;
      left += (cameraWidth - cameraHeight * mapRatio) / 2;
    }

    tourConfig.modeSetting.radarMap = {
      file: "/map.png",
      width: mapSize.width,
      height: mapSize.height,
      left,
      right,
      bottom,
      top,
      offsetX: mapForm.offsetX,
      offsetZ: mapForm.offsetZ,
      scale: mapForm.scale,
      angle: (mapForm.rotation / Math.PI) * 180,
    };
  }, [mapForm, mapSize, camera]);

  const handleTextureSizeChange = (e) => {
    setTextureSize(e.target.value);
  };
  const handleModelTypeChange = (e) => {
    setModelType(e.target.value);
  };

  return (
    <Drawer
      title="步入式漫游"
      width={600}
      onClose={onClose}
      open={open}
      bodyStyle={{
        paddingBottom: 80,
      }}
      mask={false}
    >
      <Spin tip="" spinning={loading}>
        <Divider orientation="center">相机</Divider>
        <Button type="primary" size="small" onClick={handleParseCameras}>
          解析
        </Button>
        <Button type="primary" size="small" onClick={handleCameraCollision}>
          碰撞检测
        </Button>
        <Checkbox checked={showCamera} onChange={(e) => setShowCamera(e.target.checked)}>
          显示检测结果
        </Checkbox>

        <div style={{ maxHeight: 200, overflow: "auto", marginTop: 10 }}>
          <List
            dataSource={cameraInfos}
            renderItem={(item) => <List.Item>{item.name}</List.Item>}
          />
        </div>

        <Divider orientation="center">地图投影矩阵配置</Divider>
        <UploadImg
          onMapLoaded={(url) => {
            if (!url) return;
            setMapUrl(url);

            getSize(url).then((size) => {
              setMapSize(size);
            });
          }}
          style={{ display: "inline-block" }}
        ></UploadImg>
        {mapUrl ? (
          <img src={mapUrl} style={{ width: 200, height: 200, objectFit: "contain" }}></img>
        ) : null}
        <Form
          // form={form}
          name="tourSetting"
          labelCol={{ span: 3 }}
          initialValues={mapForm}
          onValuesChange={handleMapFromChange}
        >
          <Form.Item label="偏移x" name="offsetX">
            <InputNumber type="number" step={0.01} />
          </Form.Item>
          <Form.Item label="偏移z" name="offsetZ">
            <InputNumber type="number" step={0.01} />
          </Form.Item>
          <Form.Item label="缩放" name="scale">
            <InputNumber type="number" step={0.01} />
          </Form.Item>
          <Form.Item label="旋转" name="rotation">
            <InputNumber type="number" step={0.01} />
          </Form.Item>
        </Form>
        {/* <Button type="primary" size="small" onClick={handleMapMatrixCompute}>
        雷达图投影计算
      </Button> */}

        <Divider orientation="center">配置输出</Divider>
        <Input.TextArea rows={4} placeholder="--" value={JSON.stringify(tourConfig)} />
        <Divider orientation="center">模型输出</Divider>
        <Form.Item label="贴图尺寸">
          <Radio.Group value={textureSize} onChange={handleTextureSizeChange}>
            <Radio.Button value={256}>256</Radio.Button>
            <Radio.Button value={512}>512</Radio.Button>
            <Radio.Button value={1024}>1024</Radio.Button>
            <Radio.Button value={2048}>2048</Radio.Button>
            <Radio.Button value={4096}>4096</Radio.Button>
          </Radio.Group>
        </Form.Item>
        <Form.Item label="文件类型">
          <Radio.Group value={modelType} onChange={handleModelTypeChange}>
            <Radio.Button value="glb">glb</Radio.Button>
            <Radio.Button value="gltf">gltf</Radio.Button>
          </Radio.Group>
        </Form.Item>
        <Button type="primary" size="small" onClick={handleModelDownload}>
          下载
        </Button>
      </Spin>
    </Drawer>
  );
});
