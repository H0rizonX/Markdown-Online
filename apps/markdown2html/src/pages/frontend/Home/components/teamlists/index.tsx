import React, { useState, useEffect } from "react";
import {
  Input,
  Card,
  Avatar,
  Pagination,
  Button,
  Tag,
  Modal,
  Form,
  Dropdown,
  type MenuProps,
} from "antd";
import {
  SearchOutlined,
  PlusOutlined,
  EllipsisOutlined,
  EditOutlined,
  LogoutOutlined,
  EyeOutlined,
} from "@ant-design/icons";
import type { TeamType } from "../createTeam/service";
import {
  deleteTeam,
  getAllteam,
  getInvitedUrl,
  leaveTeam,
  updatedTeamInfo,
} from "./service";
import useUserStore from "../../../../../stores/user";
import { getMessageApi } from "../../../../../utils";
import type { JointContent } from "antd/es/message/interface";

interface TeamListsProps {
  pageSize?: number;
  onCreate?: () => void;
  onSearch?: (keyword: string) => void;
  refreshKey?: number;
}

const colorsPool = [
  "magenta",
  "red",
  "volcano",
  "orange",
  "gold",
  "lime",
  "green",
  "cyan",
  "blue",
  "geekblue",
  "purple",
];
const getRandomColor = () =>
  colorsPool[Math.floor(Math.random() * colorsPool.length)];

const TeamLists: React.FC<TeamListsProps> = ({
  pageSize = 12,
  onCreate,
  onSearch,
  refreshKey = 0,
}) => {
  const [teams, setTeams] = useState<TeamType[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState<TeamType | null>(null);
  const { userInfo } = useUserStore();
  const [form] = Form.useForm();

  const [actionModal, setActionModal] = useState<{
    open: boolean;
    team?: TeamType;
    type?: "leave" | "disband";
  }>({ open: false });

  const [inviteModal, setInviteModal] = useState<{
    open: boolean;
    link?: string;
  }>({ open: false, link: "" });

  const msgBox = getMessageApi();

  const fetchTeams = async (id: number) => {
    const data = await getAllteam(id);
    const teamLists = data.data as TeamType[];
    setTeams(teamLists);
    setCurrentPage(1);
  };

  useEffect(() => {
    fetchTeams(userInfo?.id ?? 0);
  }, [userInfo?.id, refreshKey]);

  const handleSearch = () => onSearch?.(searchKeyword);

  const handleEdit = (team: TeamType) => {
    setEditingTeam(team);
    form.setFieldsValue({
      name: team.name,
      description: team.description,
      tags: team.tags?.join(","),
    });
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async (values: TeamType) => {
    try {
      if (!editingTeam) {
        msgBox.error("未找到要编辑的团队");
        return;
      }
      const { id } = editingTeam;
      const res = await updatedTeamInfo({ id, ...values });
      console.log(res);

      msgBox.success(`团队 "${values.name}" 修改成功`);
      setIsEditModalOpen(false);
      form.resetFields();
      fetchTeams(userInfo?.id ?? 0);
    } catch (error: unknown) {
      console.log(error);
      msgBox.error("更新失败");
    }
  };

  const handleActionConfirm = async (
    teamId: number,
    type: "leave" | "disband"
  ) => {
    try {
      if (type === "leave") {
        await leaveTeam({ teamId, userId: userInfo?.id ?? 0 });
        msgBox.success("已退出团队");
      } else {
        await deleteTeam(teamId);
        // console.log("解散团队:", teamId);
        msgBox.success(`团队已解散`);
      }
      fetchTeams(userInfo?.id ?? 0);
    } catch (error) {
      msgBox.error("操作失败" as JointContent);
      console.error(error);
    }
  };

  const paginatedTeams = teams.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  // 邀请
  const handleGenerateInviteLink = async (teamId: number) => {
    try {
      const res = await getInvitedUrl(teamId);
      const inviteLink = res.data as string;

      setInviteModal({
        open: true,
        link: inviteLink,
      });
    } catch (err) {
      msgBox.error("生成邀请链接失败");
      console.error(err);
    }
  };

  // 菜单组件
  const renderDropdown = (team: TeamType) => {
    const isOwner = team.ownerId === userInfo?.id;
    const isMember = team.members?.some((m) => m.id === userInfo?.id);

    const handleMenuClick: MenuProps["onClick"] = ({ key }) => {
      if (key === "edit") handleEdit(team);
      if (key === "view")
        msgBox.info(`查看团队详情: ${team.name || "未命名团队"}`);
      if (key === "leave" || key === "disband") {
        setActionModal({
          open: true,
          team,
          type: key === "leave" ? "leave" : "disband",
        });
      }
    };

    const items: MenuProps["items"] = [];
    if (isOwner) {
      items.push(
        { key: "edit", label: "编辑团队", icon: <EditOutlined /> },
        { key: "disband", label: "解散团队", icon: <LogoutOutlined /> }
      );
    } else if (isMember) {
      items.push({ key: "leave", label: "退出团队", icon: <LogoutOutlined /> });
    }
    items.push({ key: "view", label: "查看详情", icon: <EyeOutlined /> });

    return (
      <Dropdown menu={{ items, onClick: handleMenuClick }} trigger={["click"]}>
        <Button
          type="text"
          icon={<EllipsisOutlined />}
          className="absolute top-2 right-2"
        />
      </Dropdown>
    );
  };

  return (
    <div className="flex flex-col h-full relative">
      <div className="flex justify-between mb-4 items-center">
        <Input
          placeholder="搜索团队"
          allowClear
          prefix={<SearchOutlined />}
          className="max-w-sm"
          value={searchKeyword}
          onChange={(e) => setSearchKeyword(e.target.value)}
          onPressEnter={handleSearch}
        />
        {onCreate && (
          <Button type="primary" icon={<PlusOutlined />} onClick={onCreate}>
            新建团队
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-4 flex-1 overflow-auto pb-4">
        {paginatedTeams.map((team) => (
          <Card
            key={team.id}
            hoverable
            className="shadow-md transition relative rounded-xl overflow-hidden group border border-gray-100 hover:shadow-lg"
          >
            {renderDropdown(team)}

            <Card.Meta
              avatar={
                team.owner?.avatar ? (
                  <Avatar size={48} src={team.owner.avatar} />
                ) : (
                  <Avatar size={48} style={{ backgroundColor: "#ccc" }}>
                    {team.name?.[0]}
                  </Avatar>
                )
              }
              title={
                <div className="text-lg font-semibold text-gray-800 truncate">
                  {team.name}
                </div>
              }
              description={
                <div className="mt-2 flex flex-col gap-2">
                  <div className="text-sm text-gray-600 line-clamp-2">
                    {team.description || "暂无描述"}
                  </div>

                  <div className="flex flex-wrap gap-1">
                    {team.tags?.map((tag) => (
                      <Tag
                        key={tag}
                        color={getRandomColor()}
                        className="text-xs px-2 py-1"
                      >
                        {tag}
                      </Tag>
                    ))}
                  </div>

                  <div className="flex items-center gap-0 mt-2 relative">
                    {team.members?.slice(0, 4).map((member, index) => (
                      <Avatar
                        key={member.id}
                        size={32}
                        src={member.avatar}
                        alt={member.name}
                        className={`${index !== 0 ? "-ml-3" : ""} ring-2 ring-white border-white`}
                      />
                    ))}
                    <Button
                      type="dashed"
                      shape="circle"
                      size="middle"
                      onClick={() => {
                        handleGenerateInviteLink(team.id!);
                      }}
                      className="-ml-2 border-2 border-gray z-10 hover:border-blue-500 hover:text-blue-500"
                    >
                      +
                    </Button>
                  </div>

                  <div className="text-xs mt-1 text-gray-500">
                    成员数: {team.members?.length}
                  </div>
                </div>
              }
            />
          </Card>
        ))}
      </div>

      <div className="flex justify-center mt-4">
        <Pagination
          current={currentPage}
          pageSize={pageSize}
          total={teams.length}
          onChange={(page) => setCurrentPage(page)}
        />
      </div>

      {/* 编辑团队弹窗 */}
      <Modal
        title="编辑团队"
        open={isEditModalOpen}
        onCancel={() => setIsEditModalOpen(false)}
        onOk={() => form.submit()}
      >
        <Form form={form} layout="vertical" onFinish={handleEditSubmit}>
          <Form.Item
            label="团队名称"
            name="name"
            rules={[{ required: true, message: "请输入团队名称" }]}
          >
            <Input placeholder="请输入团队名称" />
          </Form.Item>

          <Form.Item label="团队描述" name="description">
            <Input.TextArea rows={3} placeholder="请输入团队描述" />
          </Form.Item>

          <Form.Item label="标签" name="tags">
            <Input placeholder="输入标签（用逗号分隔）" />
          </Form.Item>
        </Form>
      </Modal>
      {/* 解散团队 //退出团队 */}
      <Modal
        title={
          actionModal.type === "disband" ? "确认解散团队？" : "确认退出团队？"
        }
        open={actionModal.open}
        onCancel={() => setActionModal({ open: false })}
        onOk={() => {
          if (actionModal.team && actionModal.type)
            handleActionConfirm(actionModal.team.id!, actionModal.type);
          setActionModal({ open: false });
        }}
        okText={actionModal.type === "disband" ? "确认解散" : "确认退出"}
        okType={actionModal.type === "disband" ? "danger" : "default"}
        cancelText="取消"
      >
        <p>
          {actionModal.type === "disband"
            ? `解散团队 "${actionModal.team?.name}" 后，所有成员将无法访问该团队，操作不可撤销！`
            : `退出团队 "${actionModal.team?.name}" 后，将无法访问该团队的文档与成员。`}
        </p>
      </Modal>
      {/* 邀请窗口 */}
      <Modal
        title="邀请团队成员"
        open={inviteModal.open}
        onCancel={() => setInviteModal({ open: false })}
        footer={[
          <Button key="close" onClick={() => setInviteModal({ open: false })}>
            关闭
          </Button>,
          <Button
            key="copy"
            type="primary"
            onClick={() => {
              if (inviteModal.link) {
                navigator.clipboard.writeText(inviteModal.link);
                msgBox.success("已复制到剪贴板");
              }
            }}
          >
            复制链接
          </Button>,
        ]}
      >
        <div className="flex flex-col gap-2">
          <p>将下面的链接发送给你的团队成员：</p>
          <Input
            readOnly
            value={inviteModal.link}
            style={{ width: "100%", wordBreak: "break-all" }}
          />
        </div>
      </Modal>
    </div>
  );
};

export default TeamLists;
