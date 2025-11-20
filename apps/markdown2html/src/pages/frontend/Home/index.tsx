import { useCallback, useEffect, useState, type FC } from "react";
import { Modal, type MenuProps } from "antd";
import HomeMenu from "./components/menu";
import HeaderBar from "./components/header";
import NewDocumentPage from "./components/createDoc/Index";
import DocumentListPanel from "./components/documentLists";
import TeamLists from "./components/teamlists";
import TeamForm from "./components/createTeam";
import JoinTeamModal from "./components/joinTeam";
import { getDocuments } from "./service";
import useUserStore from "../../../stores/user";
import type { FileItem } from "./interface";
import { Blinds, Share2, User, Users } from "lucide-react";
import MenuItem from "antd/es/menu/MenuItem";
type MenuItem = Required<MenuProps>["items"][number];
export type TabItem = {
  key: string;
  label?: string;
  icon?: React.ReactNode;
  value?: string;
} & MenuItem;

const tabItems: TabItem[] = [
  { key: "mainPage", label: "首页", value: "all", icon: <Blinds /> },
  { key: "sharing", label: "共享", value: "shared", icon: <Share2 /> },
  { key: "mine", label: "我的文档", value: "my", icon: <User /> },
  {
    type: "divider" as const,
    key: "divider-1",
  },
  { key: "team", label: "团队", value: "team", icon: <Users /> },
];

const HomePage: FC = () => {
  const [currentTab, setCurrentTab] = useState<TabItem>(tabItems[0]);
  const [isModalVisible, setIsModalVisible] = useState(false);

  const closeModal = () => setIsModalVisible(false);
  const [teamRefreshKey, setTeamRefreshKey] = useState(0);
  const [documentLists, setDocumentLists] = useState<FileItem[]>([]);
  const { userInfo } = useUserStore();
  const handleTeamCreated = () => {
    closeModal();
    setTeamRefreshKey((prev) => prev + 1); // 触发 TeamLists 刷新
  };

  const handleDocCreated = (doc: FileItem) => {
    setDocumentLists((prev) => {
      return [doc, ...prev];
    });
  };

  const fetchGetDocs = useCallback(async () => {
    try {
      const currentUserId = userInfo?.id;
      const currentType = currentTab.value;

      const result = await getDocuments({
        authorId: currentUserId!,
        type: currentType!,
      });

      setDocumentLists(result.data as FileItem[]);
    } catch (error) {
      console.error("获取文档列表异常:", error);
      setDocumentLists([]);
    }
  }, [currentTab, userInfo?.id]); // 依赖数组完整

  useEffect(() => {
    fetchGetDocs();
  }, [fetchGetDocs]);
  return (
    <div className="h-screen bg-white flex flex-col overflow-auto">
      <HeaderBar />
      <div className="flex flex-1 overflow-y">
        <aside className="w-56 h-full">
          <HomeMenu
            currentKey={currentTab.key}
            onSelect={(key: string) => {
              const tab = tabItems.find((t) => t.key === key);
              if (tab) setCurrentTab(tab);
            }}
            tabs={tabItems}
          />
        </aside>

        <main className="flex-1 flex flex-col px-4 py-6">
          {currentTab.key === "team" ? (
            <TeamLists
              pageSize={12}
              refreshKey={teamRefreshKey}
              onCreate={() => setIsModalVisible(true)}
            />
          ) : (
            <DocumentListPanel
              files={documentLists}
              onCreate={() => setIsModalVisible(true)}
              onDeleteSuccess={async () => {
                await fetchGetDocs();
              }}
            />
          )}
        </main>
      </div>
      <Modal
        title={`新建 ${currentTab.label}`}
        open={isModalVisible}
        onCancel={closeModal}
        footer={null}
      >
        {currentTab.key === "team" ? (
          <TeamForm
            onSuccess={() => {
              closeModal();
              handleTeamCreated(); // 刷新团队列表
            }}
          />
        ) : (
          <NewDocumentPage
            onSuccess={(doc) => {
              closeModal();
              handleDocCreated(doc); //更新doc
            }}
          />
        )}
      </Modal>
      <JoinTeamModal />
    </div>
  );
};

export default HomePage;
