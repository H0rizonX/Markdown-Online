import { useState, type FC } from "react";
import { Modal } from "antd";
import HomeMenu from "./components/menu";
import HeaderBar from "./components/header";
import NewDocumentPage from "./components/createDoc/Index";
import DocumentListPanel from "./components/documentLists";
import TeamLists from "./components/teamlists";
import TeamForm from "./components/createTeam";
import JoinTeamModal from "./components/joinTeam";

interface TabItem {
  key: string;
  title: string;
  icon?: React.ReactNode;
}

const tabItems: TabItem[] = [
  { key: "mainPage", title: "首页" },
  { key: "sharing", title: "共享" },
  { key: "liked", title: "收藏" },
  { key: "mine", title: "我的文档" },
  { key: "team", title: "团队文档" },
];

const HomePage: FC = () => {
  const [currentTab, setCurrentTab] = useState<TabItem>(tabItems[0]);
  const [isModalVisible, setIsModalVisible] = useState(false);

  const closeModal = () => setIsModalVisible(false);
  const [teamRefreshKey, setTeamRefreshKey] = useState(0);

  const handleTeamCreated = () => {
    closeModal();
    setTeamRefreshKey((prev) => prev + 1); // 触发 TeamLists 刷新
  };
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
              files={[]}
              onCreate={() => setIsModalVisible(true)}
            />
          )}
        </main>
      </div>
      <Modal
        title={`新建 ${currentTab.title}`}
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
          <NewDocumentPage onSuccess={closeModal} />
        )}
      </Modal>
      <JoinTeamModal />
    </div>
  );
};

export default HomePage;
