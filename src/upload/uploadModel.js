import { Upload as UL, Modal } from "antd";
import { InboxOutlined } from "@ant-design/icons";
import loadModel from "../loader/index.js";
import { useRef, useCallback } from "react";

const { Dragger } = UL;

export function UploadModel(props) {
  const fileListRef = useRef(null);

  const uploadFile = useCallback((files) => {
    if (!files) return;

    const mainFiles = files.filter((file) => {
      return /\.(gltf|glb|dae)$/i.test(file.name);
    });

    if (!mainFiles.length) {
      if (props.onError) props.onError();
      Modal.error({
        title: "文件类型不支持",
        content: "目前仅支持gltf、glb、dae",
      });
      return;
    }

    const fileObj = {};
    files.forEach((file) => {
      fileObj[file.name] = URL.createObjectURL(file);
    });
    const modifier = (url) => {
      const responseFile = Object.entries(fileObj).find(([name]) =>
        new RegExp(`${name}$`).test(url)
      );
      return responseFile ? responseFile[1] : url;
    };

    Promise.all(
      mainFiles.map((mainFile) => {
        return loadModel(URL.createObjectURL(mainFile), mainFile.name, modifier);
      })
    )
      .then((models) => {
        if (props.onModelLoaded) props.onModelLoaded(models);
      })
      .catch((err) => {
        if (props.onError) props.onError();
        Modal.error({
          title: "模型解析失败",
          content: err.toString(),
        });
      });
  }, []);

  const config = {
    multiple: true,
    showUploadList: false,
    beforeUpload: (_, fileList) => {
      if (fileList === fileListRef.current) return false;

      fileListRef.current = fileList;
      uploadFile(fileList);
      return false;
    },
    onDrop(e) {
      // uploadFile(Array.from(e.dataTransfer.files));
    },
    fileList: [],
  };
  return (
    <div style={{ width: 200, height: 200 }}>
      <Dragger {...config}>
        <p className="ant-upload-drag-icon">
          <InboxOutlined />
        </p>
        <p className="ant-upload-text">导入模型</p>
      </Dragger>
    </div>
  );
}
