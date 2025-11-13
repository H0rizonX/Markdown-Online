import React, { useState } from "react";
import {
  Form,
  Input,
  Button,
  Radio,
  Select,
  message,
  type RadioChangeEvent,
} from "antd";
import type { ArticleType } from "../../../../../types/common";
import useUserStore from "../../../../../stores/user";
import type { TeamType } from "../createTeam/service";
import { getAllteam } from "../teamlists/service";
import { createArticle } from "./service";
import { getMessageApi } from "../../../../../utils";
import type { FileItem } from "../../interface";

const { Option } = Select;

interface NewDocumentPageProps {
  onSuccess?: (doc: FileItem) => void;
}

const defaultTagsOptions = ["项目A", "项目B", "重要文档", "测试"];

const NewDocumentPage: React.FC<NewDocumentPageProps> = ({ onSuccess }) => {
  const [form] = Form.useForm();
  const [tagsOptions, setTagsOptions] = useState(defaultTagsOptions);
  const [teams, setTeams] = useState<{ id: number; name: string }[]>([]);
  const [visibility, setVisibility] = useState<string>("private");
  const { userInfo } = useUserStore();
  const msgBox = getMessageApi();

  // 当选择“团队可见”时加载自己创建的团队
  const fetchTeams = async (userId: number) => {
    try {
      const res = await getAllteam(userId);
      const teamLists = res.data as TeamType[];
      const teamList = teamLists
        .filter(
          (team: TeamType) => team.id !== undefined && team.name !== undefined
        )
        .map((team: TeamType) => ({
          id: team.id as number,
          name: team.name as string,
        }));
      setTeams(teamList);
    } catch (error) {
      console.error("获取团队失败:", error);
      message.error("获取团队列表失败");
    }
  };

  const onFinish = async (values: ArticleType) => {
    const { title, visibility, tags, teamId } = values;
    console.log(values, "value");
    const doc = {
      title,
      authorId: userInfo?.id ?? 0,
      visibility,
      tags,
      content: "",
      teamId,
    };
    const team: TeamType = {
      id: teamId,
    };
    const res = await createArticle({ doc, team });
    console.log(res, "create");
    msgBox.success("文档创建成功");
    form.resetFields();
    onSuccess?.(res.data as FileItem);
  };

  // 切换可见性
  const handleVisibilityChange = (e: RadioChangeEvent) => {
    const value = e.target.value;
    setVisibility(value);
    if (value === "team" && userInfo?.id) {
      fetchTeams(userInfo.id);
    }
  };

  return (
    <Form form={form} layout="vertical" onFinish={onFinish}>
      <Form.Item
        label="文档名"
        name="title"
        rules={[{ required: true, message: "请输入文档名" }]}
      >
        <Input placeholder="请输入文档名" />
      </Form.Item>

      {/*   <Form.Item
        label="文档类型"
        name="type"
        rules={[{ required: true, message: "请选择文档类型" }]}
      >
        <Radio.Group defaultValue="document">
          <Radio value="document">文档</Radio>
        </Radio.Group>
      </Form.Item> */}

      <Form.Item
        label="可见性"
        name="visibility"
        rules={[{ required: true, message: "请选择可见性" }]}
      >
        <Radio.Group onChange={handleVisibilityChange} value={visibility}>
          <Radio value="team">团队可见</Radio>
          <Radio value="personal">仅自己可见</Radio>
        </Radio.Group>
      </Form.Item>

      {/* 如果选择团队可见，则显示团队选择框 */}
      {visibility === "team" && (
        <Form.Item
          label="所属团队"
          name="teamId"
          rules={[{ required: true, message: "请选择团队" }]}
        >
          <Select placeholder="请选择一个团队">
            {teams.map((team) => (
              <Option key={team.id} value={team.id}>
                {team.name}
              </Option>
            ))}
          </Select>
        </Form.Item>
      )}

      <Form.Item label="文件关联" name="tags">
        <Select
          mode="tags"
          placeholder="选择或输入标签"
          onChange={(newTags) => {
            setTagsOptions((prev) =>
              Array.from(new Set([...prev, ...newTags]))
            );
          }}
        >
          {tagsOptions.map((tag) => (
            <Option key={tag} value={tag}>
              {tag}
            </Option>
          ))}
        </Select>
      </Form.Item>

      <Form.Item>
        <Button type="primary" htmlType="submit" block>
          创建
        </Button>
      </Form.Item>
    </Form>
  );
};

export default NewDocumentPage;
