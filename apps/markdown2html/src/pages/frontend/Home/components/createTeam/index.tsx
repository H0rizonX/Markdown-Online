import React from "react";
import { Form, Input, Button, Select } from "antd";
import { createTeam, type TeamType } from "./service";
import useUserStore from "../../../../../stores/user";
import { useNavigate } from "react-router-dom";
import { getMessageApi } from "../../../../../utils";

const { TextArea } = Input;
const { Option } = Select;

interface TeamFormProps {
  onSuccess?: () => void;
}

const defaultTagsOptions = ["开发", "产品", "设计", "测试"];

const TeamForm: React.FC<TeamFormProps> = ({ onSuccess }) => {
  const [form] = Form.useForm();
  const [tagsOptions, setTagsOptions] = React.useState(defaultTagsOptions);
  const { userInfo } = useUserStore();
  const navigator = useNavigate();

  const msgBox = getMessageApi();
  const onFinish = async (values: TeamType) => {
    if (!userInfo?.id) {
      navigator("/login");
      msgBox.error("登录失效，请重新登录");
      return;
    }
    const teamInfo: TeamType = {
      ...values,
      ownerId: +userInfo.id,
    };

    try {
      const res = await createTeam(teamInfo); // 传入 teamInfo
      console.log(res);
      form.resetFields();
      msgBox.success(`团队 "${values.name}" 创建成功！`);
      onSuccess?.();
    } catch (error) {
      console.error(error);
      msgBox.error("创建团队失败，请重试");
    }
  };

  return (
    <Form form={form} layout="vertical" onFinish={onFinish}>
      <Form.Item
        label="团队名称"
        name="name"
        rules={[{ required: true, message: "请输入团队名称" }]}
      >
        <Input placeholder="请输入团队名称" />
      </Form.Item>

      <Form.Item label="团队描述" name="description">
        <TextArea placeholder="请输入团队描述" rows={3} />
      </Form.Item>

      <Form.Item label="标签" name="tags">
        <Select
          mode="tags"
          placeholder="选择或输入标签"
          onChange={(newTags) => {
            setTagsOptions((prev) =>
              Array.from(new Set([...prev, ...newTags]))
            );
          }}
        >
          {tagsOptions.map((tag) => (
            <Option key={tag} value={tag}>
              {tag}
            </Option>
          ))}
        </Select>
      </Form.Item>

      <Form.Item>
        <Button type="primary" htmlType="submit" block>
          创建团队
        </Button>
      </Form.Item>
    </Form>
  );
};

export default TeamForm;
