import { useState, useEffect, type FC } from "react";
import { Form, Input, Button } from "antd";
import { UserOutlined, MailOutlined, LockOutlined } from "@ant-design/icons";
import type { UserType } from "../../../../types/common";
import ProfileAvatar from "./avatar";
import { updateUserInfo, uploadAvatar } from "../service";

interface ProfileProps {
  user: UserType; // 从父组件传入
  onSubmit?: (updatedUser: UserType) => void; // 可选回调
}

const Profile: FC<ProfileProps> = ({ user, onSubmit }) => {
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    form.setFieldsValue(user);
  }, [user, form]);

  const handleFinish = async (values: UserType) => {
    setLoading(true);
    await updateUserInfo(values);
    setLoading(false);
    if (onSubmit) {
      onSubmit(values);
    }
  };

  const handleUpload = async (file: File) => {
    try {
      const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";

      // 直接用时间戳作为文件名
      const timestamp = Date.now();
      const newFileName = `${timestamp}.${ext}`;

      const newFile = new File([file], newFileName, { type: file.type });

      const res = await uploadAvatar(newFile);
      const userUpdated = res.data as UserType;
      if (onSubmit) {
        onSubmit(userUpdated);
      }
    } catch (error) {
      console.log(error);
    }
  };
  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col items-center pt-6 pb-10">
      <ProfileAvatar
        avatar={user.avatar}
        name={user.name}
        onChangeAvatar={(file) => {
          handleUpload(file);
        }}
      />

      <div className="w-full bg-white p-10 rounded-xl shadow-lg">
        <Form form={form} layout="vertical" onFinish={handleFinish}>
          <Form.Item label="用户id" name="id">
            <span className="text-xl font-bold">{user.id}</span>
          </Form.Item>
          <Form.Item
            label="用户名"
            name="name"
            rules={[{ required: true, message: "请输入用户名" }]}
          >
            <Input
              prefix={<UserOutlined />}
              placeholder="用户名"
              size="large"
            />
          </Form.Item>

          <Form.Item
            label="邮箱"
            name="email"
            rules={[
              { required: true, message: "请输入邮箱" },
              { type: "email", message: "请输入正确的邮箱地址" },
            ]}
          >
            <Input prefix={<MailOutlined />} placeholder="邮箱" size="large" />
          </Form.Item>

          <Form.Item label="密码" name="password">
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="修改密码"
              size="large"
            />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              size="large"
              block
            >
              保存修改
            </Button>
          </Form.Item>
        </Form>
      </div>
    </div>
  );
};

export default Profile;
