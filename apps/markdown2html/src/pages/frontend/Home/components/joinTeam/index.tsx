import { useEffect, useState } from "react";
import { Button, Modal, message } from "antd";
import { useSearchParams, useNavigate } from "react-router-dom";
import type { FC } from "react";
import { join } from "./service";
import useUserStore from "../../../../../stores/user";
import { getMessageApi } from "../../../../../utils";

const JoinTeamModal: FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [token, setToken] = useState<string | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const { userInfo } = useUserStore();
  const msgBox = getMessageApi();

  useEffect(() => {
    const t = searchParams.get("token");
    if (t) {
      setToken(t);
      setIsModalVisible(true); // 打开弹窗
    }
  }, [searchParams]);

  const handleJoinTeam = async () => {
    if (!token) return;
    try {
      const res = await join({ token, userId: userInfo?.id ?? 0 });
      msgBox.success(res.data as string);

      // 关闭弹窗
      setIsModalVisible(false);

      // 回到主页，清掉 /join 路径和 token 参数
    } catch (err) {
      console.error(err);
      message.error("加入团队出错");
    } finally {
      navigate("/", { replace: true });
    }
  };

  return (
    <Modal
      title="加入团队"
      open={isModalVisible}
      onCancel={() => setIsModalVisible(false)}
      footer={[
        <Button
          key="cancel"
          onClick={() => {
            setIsModalVisible(false);
            navigate("/");
          }}
        >
          取消
        </Button>,
        <Button key="join" type="primary" onClick={handleJoinTeam}>
          加入团队
        </Button>,
      ]}
    >
      <p>检测到邀请链接，是否加入团队？</p>
    </Modal>
  );
};

export default JoinTeamModal;
