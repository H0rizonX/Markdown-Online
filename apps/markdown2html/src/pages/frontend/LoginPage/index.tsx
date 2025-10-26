import { useState, useEffect } from "react";
import { Button, Input, Form, message } from "antd";
import { useNavigate } from "react-router-dom";
import { UserOutlined, LockOutlined, MailOutlined } from "@ant-design/icons";
import {
  Login,
  Register,
  sendEmail,
  type LoginType,
  type registerType,
} from "./service";

const AuthPage = () => {
  const [loading, setLoading] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [messageApi, contextHolder] = message.useMessage();
  const [form] = Form.useForm();
  const navigator = useNavigate();

  // 新增倒计时状态，初始为0（未倒计时）
  const [countdown, setCountdown] = useState(0);

  type AuthValues = Partial<LoginType & registerType>;

  // 发送验证码
  const sendCode = async () => {
    const email = form.getFieldValue("email");
    if (!email) {
      messageApi.open({
        type: "warning",
        content: "请输入正确的邮箱",
      });
      return;
    }
    try {
      const res = await sendEmail({ email });
      console.log(res.status, "status");
      console.log(res, "res");
      messageApi.open({
        type: +res.status ? "warning" : "success",
        content: res.message,
      });

      if (+res.status === 0) {
        setCountdown(60);
      }
    } catch (error) {
      messageApi.error("验证码发送失败");
      console.error(error);
    }
  };

  // useEffect 实现倒计时逻辑
  useEffect(() => {
    if (countdown <= 0) return; // 倒计时结束

    const timer = setTimeout(() => {
      setCountdown(countdown - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [countdown]);

  // 统一处理登录和注册
  const handleFinish = async (values: AuthValues) => {
    setLoading(true);
    try {
      if (isLogin) {
        const loginData = values as LoginType;
        const res = await Login(loginData);
        if (res.status === 0) {
          navigator("/");
          messageApi.open({
            type: "success",
            content: res.message,
          });
        } else {
          messageApi.open({
            type: "warning",
            content: res.message,
          });
        }
      } else {
        const registerData = values as registerType;
        const res = await Register(registerData);
        if (res.status === 0) {
          setIsLogin(true);
          messageApi.open({
            type: "success",
            content: res.message,
          });
          form.resetFields();
        } else {
          messageApi.open({
            type: "warning",
            content: res.message,
          });
        }
      }
    } catch (error) {
      messageApi.error(isLogin ? "登录失败" : "注册失败");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      {contextHolder}
      <div className="max-w-md w-full bg-white p-8 rounded shadow-md">
        <h2 className="text-2xl font-semibold mb-6 text-center">
          {isLogin ? "欢迎登录" : "邮箱注册"}
        </h2>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleFinish}
          autoComplete="off"
        >
          {isLogin ? (
            <>
              <Form.Item
                label="用户 ID 或邮箱"
                name="identify"
                rules={[{ required: true, message: "请输入用户 ID 或邮箱" }]}
              >
                <Input
                  prefix={<UserOutlined />}
                  placeholder="请输入用户 ID 或邮箱"
                />
              </Form.Item>

              <Form.Item
                label="密码"
                name="password"
                rules={[{ required: true, message: "请输入密码" }]}
              >
                <Input.Password
                  prefix={<LockOutlined />}
                  placeholder="请输入密码"
                />
              </Form.Item>
            </>
          ) : (
            <>
              <Form.Item
                label="邮箱"
                name="email"
                rules={[
                  { required: true, message: "请输入邮箱" },
                  { type: "email", message: "请输入有效的邮箱地址" },
                ]}
              >
                <Input prefix={<MailOutlined />} placeholder="请输入邮箱" />
              </Form.Item>

              <Form.Item
                label="验证码"
                name="code"
                rules={[{ required: true, message: "请输入验证码" }]}
              >
                <Input
                  placeholder="请输入邮箱验证码"
                  addonAfter={
                    <Button
                      onClick={sendCode}
                      type="link"
                      style={{ padding: 0 }}
                      disabled={countdown > 0} // 倒计时期间禁用按钮
                    >
                      {countdown > 0 ? `${countdown}s 后重发` : "发送验证码"}
                    </Button>
                  }
                />
              </Form.Item>

              <Form.Item
                label="密码"
                name="password"
                rules={[
                  { required: true, message: "请输入密码" },
                  { min: 6, message: "密码至少6位" },
                ]}
                hasFeedback
              >
                <Input.Password placeholder="请输入密码" />
              </Form.Item>

              <Form.Item
                label="确认密码"
                name="confirm"
                dependencies={["password"]}
                hasFeedback
                rules={[
                  { required: true, message: "请确认密码" },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!value || getFieldValue("password") === value) {
                        return Promise.resolve();
                      }
                      return Promise.reject(new Error("两次密码输入不一致"));
                    },
                  }),
                ]}
              >
                <Input.Password placeholder="请确认密码" />
              </Form.Item>
            </>
          )}

          <Form.Item>
            <Button type="primary" htmlType="submit" block loading={loading}>
              {isLogin ? "登录" : "注册"}
            </Button>
            <div className="mt-4 text-center">
              {isLogin ? (
                <>
                  没有账号？{" "}
                  <Button
                    type="link"
                    onClick={() => {
                      setIsLogin(false);
                      form.resetFields();
                    }}
                  >
                    去注册
                  </Button>
                </>
              ) : (
                <>
                  已有账号？{" "}
                  <Button
                    type="link"
                    onClick={() => {
                      setIsLogin(true);
                      form.resetFields();
                    }}
                  >
                    去登录
                  </Button>
                </>
              )}
            </div>
          </Form.Item>
        </Form>
      </div>
    </div>
  );
};

export default AuthPage;
