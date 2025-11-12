import { type FC } from "react";
import type { MenuProps } from "antd";
import { Menu } from "antd";
import type { TabItem } from "../..";

interface HomeMenuProps {
  currentKey: string;

  onSelect: (key: string) => void;

  tabs: TabItem[];
}

const HomeMenu: FC<HomeMenuProps> = ({ currentKey, onSelect, tabs }) => {
  const onClick: MenuProps["onClick"] = (e) => {
    onSelect(e.key);
  };

  return (
    <Menu
      onClick={onClick}
      className="w-full h-full border-none"
      selectedKeys={[currentKey]}
      mode="inline"
      items={tabs}
    />
  );
};

export default HomeMenu;
