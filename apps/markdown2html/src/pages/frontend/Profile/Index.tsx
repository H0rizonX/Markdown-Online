import React, { useEffect, useState } from "react";
import { Button } from "antd";
import { ArrowLeftOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import useUserStore from "../../../stores/user";
import type { UserType } from "../../../types/common";
import Profile from "./components/Profile";

const ProfileCenter: React.FC = () => {
  const [user, setUser] = useState<UserType | null>(null);

  const { userInfo } = useUserStore();
  const navigator = useNavigate();
  useEffect(() => {
    setUser(userInfo);
  }, [userInfo]);
  return (
    <div>
      <Button
        type="link"
        icon={<ArrowLeftOutlined />}
        onClick={() => navigator(-1)}
        className="mb-5 mt-2 text-lg px-4 py-2"
      >
        返回
      </Button>
      <div className="w-[80%] h-auto mx-auto flex justify-center space-x-6">
        <Sidebar />
        {user && <Profile user={user} />}
      </div>
    </div>
  );
};

export default ProfileCenter;
