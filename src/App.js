import { useState, useRef, createContext } from "react";
import { computeMapMatrix as pureComputeMapMatrix } from "./setting/tourSetting/utils";
import { UploadModel } from "./upload/uploadModel";
import { Viewer } from "./viewer";
import { LightSetting } from "./setting/lightSetting";
import { TourSetting } from "./setting/tourSetting";
import { useCamera } from "./camera/cameraHook";
import { Scene } from "./scene";
import { Button } from "antd";

export const settingContext = createContext();

function App() {
  const lightSettingRef = useRef();
  const tourSettingRef = useRef();
  const [model, setModel] = useState([]);
  const viewRef = useRef();
  const [setting, updateSetting] = useState({
    light: {
      ambientStrength: 0.5,
    },
    tour: {
      mapUrl: "",
      mapRatio: { width: 1, height: 1 },
      computeMapMatrix: () => {
        const { size } = viewRef.current;
        const { mapRatio } = tourSettingRef.current;
        return pureComputeMapMatrix(size, mapRatio, camera);
      },
      toggleControllerDisable: (disable) => viewRef.current?.toggleControllerDisable(disable),
      updateControllerTarget: (targetPosition) =>
        viewRef.current?.updateControllerTarget(targetPosition),
      updateController: () => viewRef.current?.updateController(),
    },
  });
  const [camera] = useCamera();

  const showLightDrawer = () => {
    lightSettingRef.current.open();
  };
  const showTourDrawer = () => {
    tourSettingRef.current.open();
  };

  return (
    <Scene>
      <settingContext.Provider value={{ setting, updateSetting, camera }}>
        <div className="md-app">
          <Viewer model={model} ref={viewRef}></Viewer>
          <UploadModel
            onModelLoaded={(model) => {
              setModel(model);
            }}
          ></UploadModel>
          <Button
            style={{
              position: "fixed",
              right: 50,
              top: 50,
            }}
            onClick={showLightDrawer}
          >
            灯光
          </Button>
          <Button
            style={{
              position: "fixed",
              right: 50,
              top: 100,
            }}
            onClick={showTourDrawer}
          >
            步入式
          </Button>
          <LightSetting ref={lightSettingRef}></LightSetting>
          <TourSetting
            ref={tourSettingRef}
            updateMapUrl={(url) => {
              setting.tour.mapUrl = url;
              updateSetting({ ...setting });
            }}
            updateMapSize={(size) => {
              setting.tour.mapRatio = size.width / size.height;
              updateSetting({ ...setting });
            }}
          ></TourSetting>
        </div>
      </settingContext.Provider>
    </Scene>
  );
}

export default App;
