import { Upload as UL, Modal } from "antd";
import { InboxOutlined } from "@ant-design/icons";
import loadModel from "../loader/index.js";
import { useRef, useCallback } from "react";

const showConfirm = () => {
  Modal.error({
    title: "文件类型不支持",
    content: "目前仅支持jpg、jpeg、png",
  });
};

const { Dragger } = UL;

export function UploadImg(props) {
  const fileListRef = useRef(null);

  const uploadFile = useCallback((files) => {
    if (!files) return;

    const imgFile = files.find((file) => {
      return /\.(jpe?g|png)$/.test(file.name);
    });

    if (!imgFile) {
      showConfirm();
      return;
    }

    if (props.onMapLoaded) props.onMapLoaded(URL.createObjectURL(imgFile));
  }, []);

  const config = {
    multiple: false,
    showUploadList: false,
    beforeUpload: (_, fileList) => {
      if (fileList === fileListRef.current) return false;

      fileListRef.current = fileList;
      uploadFile(fileList);
      return false;
    },
    onDrop(e) {
      uploadFile(Array.from(e.dataTransfer.files));
    },
    fileList: [],
  };

  return (
    <div style={{ width: 200, height: 200 , ...props.style}}>
      <Dragger {...config}>
        <p className="ant-upload-drag-icon">
          <InboxOutlined />
        </p>
        <p className="ant-upload-text">导入地图</p>
      </Dragger>
    </div>
  );
}
