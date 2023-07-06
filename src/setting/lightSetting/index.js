import { Drawer } from "antd";
import { Form, Slider } from "antd";
import { settingContext } from "../../App";
import { useContext, useImperativeHandle, useState, forwardRef } from "react";

export const LightSetting = forwardRef(function (props, ref) {
  const { setting, updateSetting } = useContext(settingContext);
  const [open, setOpen] = useState(false);

  useImperativeHandle(ref, () => {
    return {
      open: () => {
        setOpen(true);
      },
    };
  });

  const onClose = () => {
    setOpen(false);
  };

  const onChange = (value) => {
    setting.light.ambientStrength = value;
    updateSetting({ ...setting });
  };

  return (
    <Drawer
      title="灯光"
      width={400}
      onClose={onClose}
      open={open}
      bodyStyle={{
        paddingBottom: 80,
      }}
      mask={false}
    >
      <Form.Item label="环境光强度">
        <Slider
          defaultValue={setting.light.ambientStrength}
          max={1}
          min={0}
          step={0.01}
          onChange={onChange}
        />
      </Form.Item>
    </Drawer>
  );
});
