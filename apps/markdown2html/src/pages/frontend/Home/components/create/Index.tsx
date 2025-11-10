import React from "react";
import { Form, Input, Button, Radio, Select, message } from "antd";
import type { ArticleType } from "../../../../../types/common";

const { Option } = Select;

interface NewDocumentPageProps {
  onSuccess?: () => void;
}

const defaultTagsOptions = ["项目A", "项目B", "重要文档", "测试"];

const NewDocumentPage: React.FC<NewDocumentPageProps> = ({ onSuccess }) => {
  const [form] = Form.useForm();
  const [tagsOptions, setTagsOptions] = React.useState(defaultTagsOptions);

  const onFinish = (values: ArticleType) => {
    console.log("新建文档信息:", values);
    message.success(`文档 "${values.title || values.title}" 创建成功！`);
    form.resetFields();
    onSuccess?.();
  };

  return (
    <Form form={form} layout="vertical" onFinish={onFinish}>
      <Form.Item
        label="文档名"
        name="name"
        rules={[{ required: true, message: "请输入文档名" }]}
      >
        <Input placeholder="请输入文档名" />
      </Form.Item>

      <Form.Item
        label="文档类型"
        name="type"
        rules={[{ required: true, message: "请选择文档类型" }]}
      >
        <Radio.Group>
          <Radio value="document">文档</Radio>
          <Radio value="sheet">表格</Radio>
        </Radio.Group>
      </Form.Item>

      <Form.Item
        label="可见性"
        name="visibility"
        rules={[{ required: true, message: "请选择可见性" }]}
      >
        <Radio.Group>
          <Radio value="team">团队可见</Radio>
          <Radio value="private">仅自己可见</Radio>
        </Radio.Group>
      </Form.Item>

      <Form.Item label="文件关联" name="tags">
        <Select
          mode="tags" // 支持自由创建和删除
          placeholder="选择或输入标签"
          onChange={(newTags) => {
            // 将新标签添加到 options 中
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
          创建
        </Button>
      </Form.Item>
    </Form>
  );
};

export default NewDocumentPage;
