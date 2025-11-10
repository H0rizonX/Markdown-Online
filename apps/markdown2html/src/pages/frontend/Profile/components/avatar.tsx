import React, { useRef } from "react";
import { Avatar } from "antd";
import { UserOutlined, CameraOutlined } from "@ant-design/icons";

interface ProfileAvatarProps {
  avatar?: string;
  name: string;
  onChangeAvatar?: (file: File) => void;
}

const ProfileAvatar: React.FC<ProfileAvatarProps> = ({
  avatar,
  name,
  onChangeAvatar,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleClick = () => {
    inputRef.current?.click();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onChangeAvatar?.(file);
    }
  };

  return (
    <div className="flex items-center gap-6 w-full mb-6">
      <div className="relative group">
        <Avatar size={120} icon={<UserOutlined />} src={avatar} />

        <div
          className="absolute inset-0 bg-black bg-opacity-25 flex items-center justify-center opacity-0 group-hover:opacity-100 transition cursor-pointer rounded-full"
          onClick={handleClick}
        >
          <CameraOutlined className="text-white text-2xl" />
        </div>

        <input
          type="file"
          accept="image/*"
          ref={inputRef}
          onChange={handleChange}
          className="hidden"
        />
      </div>

      {/* 用户名 */}
      <h2 className="text-3xl font-semibold">{name}</h2>
    </div>
  );
};

export default ProfileAvatar;
