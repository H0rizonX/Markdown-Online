import { useState, useEffect } from "react";
import { Button, Input, Form, Modal } from "antd";
import { useLocation, useNavigate } from "react-router-dom";
import { UserOutlined, LockOutlined, MailOutlined } from "@ant-design/icons";
import {
  Login,
  Register,
  sendEmail,
  resetPassword,
  type resetType,
  getUserInfo,
} from "./service";
import { getMessageApi } from "../../../utils";
import type { dataType } from "../../../types/common";
import { useTokenStore } from "../../../stores/token";
import { useUserStore } from "../../../stores/user";
import type { LoginType, registerType } from "./interface";

const LoginPage = () => {
  const [loading, setLoading] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [form] = Form.useForm();
  const [resetForm] = Form.useForm();
  const navigator = useNavigate();
  // 倒计时状态
  const [countdown, setCountdown] = useState(0);
  const [resetCountdown, setResetCountdown] = useState(0);

  // 忘记密码弹窗状态
  const [forgotVisible, setForgotVisible] = useState(false);

  // 存储库
  const { setToken } = useTokenStore();
  const { login } = useUserStore();
  // 弹窗
  const msgBox = getMessageApi();
  type AuthValues = Partial<LoginType & registerType>;
  // 历史路由
  const location = useLocation();
  // === 通用验证码发送函数 ===
  const handleSendCode = async (
    email: string,
    setTimer: React.Dispatch<React.SetStateAction<number>>
  ) => {
    if (!email) {
      msgBox.warning("请输入正确的邮箱");
      return;
    }
    try {
      const res = await sendEmail({ email });
      msgBox.open({
        type: +res.status ? "warning" : "success",
        content: res.message,
      });
      if (+res.status === 0) {
        setTimer(60);
      }
    } catch (error) {
      msgBox.error("验证码发送失败");
      console.error(error);
    }
  };

  // 登录注册验证码倒计时
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  // 忘记密码验证码倒计时
  useEffect(() => {
    if (resetCountdown <= 0) return;
    const timer = setTimeout(() => setResetCountdown(resetCountdown - 1), 1000);
    return () => clearTimeout(timer);
  }, [resetCountdown]);

  // === 登录注册提交 ===
  const handleFinish = async (values: AuthValues) => {
    setLoading(true);
    try {
      if (isLogin) {
        const res = await Login(values as LoginType);
        if (res.status === 0) {
          // 存储 token 和用户信息
          const loginData = res.data as dataType;
          if (loginData.token) {
            setToken(loginData.token);
            const result = await getUserInfo(loginData.token);
            const userInfo = result.data as dataType;
            login(userInfo.user!);
          }
          const from = location.state?.from?.pathname || "/"; // 默认首页
          navigator(from + (location.state?.from?.search || ""), {
            replace: true,
          });
          msgBox.success(res.message);
        } else {
          msgBox.warning(res.message);
        }
      } else {
        const res = await Register(values as registerType);
        if (res.status === 0) {
          setIsLogin(true);
          msgBox.success("注册成功");
          form.resetFields();
        } else {
          msgBox.warning(res.message || "注册失败");
        }
      }
    } catch (error) {
      msgBox.error(isLogin ? "登录失败" : "注册失败");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (value: resetType) => {
    const { email, code, password } = value;
    const resetValue: resetType = {
      email,
      code,
      password,
    };
    const res = await resetPassword(resetValue);

    msgBox.success(res.message);
    setForgotVisible(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
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
                  autoComplete="username"
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
                  autoComplete="current-password"
                />
              </Form.Item>

              {/* 忘记密码按钮 */}
              <div className="text-right mb-3">
                <Button
                  type="link"
                  size="small"
                  onClick={() => {
                    setForgotVisible(true);
                    resetForm.resetFields();
                  }}
                >
                  忘记密码？
                </Button>
              </div>
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
                <Input
                  prefix={<MailOutlined />}
                  placeholder="请输入邮箱"
                  autoComplete="email"
                />
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
                      onClick={() =>
                        handleSendCode(
                          form.getFieldValue("email"),
                          setCountdown
                        )
                      }
                      type="link"
                      style={{ padding: 0, height: "30px" }}
                      disabled={countdown > 0}
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
                <Input.Password
                  placeholder="请输入密码"
                  autoComplete="new-password"
                />
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
                <Input.Password
                  placeholder="请确认密码"
                  autoComplete="new-password"
                />
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

      {/* === 忘记密码弹窗 === */}
      <Modal
        title="重置密码"
        open={forgotVisible}
        onCancel={() => setForgotVisible(false)}
        footer={null}
        destroyOnHidden
      >
        <Form form={resetForm} layout="vertical" onFinish={handleResetPassword}>
          <Form.Item
            label="邮箱"
            name="email"
            rules={[
              { required: true, message: "请输入邮箱" },
              { type: "email", message: "请输入有效的邮箱地址" },
            ]}
          >
            <Input
              prefix={<MailOutlined />}
              placeholder="请输入邮箱"
              autoComplete="email"
            />
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
                  onClick={() =>
                    handleSendCode(
                      resetForm.getFieldValue("email"),
                      setResetCountdown
                    )
                  }
                  type="link"
                  style={{ padding: 0, height: "30px" }}
                  disabled={resetCountdown > 0}
                >
                  {resetCountdown > 0
                    ? `${resetCountdown}s 后重发`
                    : "发送验证码"}
                </Button>
              }
            />
          </Form.Item>

          <Form.Item
            label="新密码"
            name="password"
            rules={[
              { required: true, message: "请输入新密码" },
              { min: 6, message: "密码至少6位" },
            ]}
            hasFeedback
          >
            <Input.Password
              placeholder="请输入新密码"
              autoComplete="new-password"
            />
          </Form.Item>

          <Form.Item
            label="确认新密码"
            name="confirm"
            dependencies={["password"]}
            hasFeedback
            rules={[
              { required: true, message: "请确认新密码" },
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
            <Input.Password
              placeholder="请确认新密码"
              autoComplete="new-password"
            />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" block loading={loading}>
              重置密码
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default LoginPage;
