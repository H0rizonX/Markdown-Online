import { useState, useMemo, type FC } from "react";
import { Button, Input } from "antd";
import { SearchOutlined } from "@ant-design/icons";
import HomeMenu from "./components/menu";
import HeaderBar from "./components/header";
import FileGrid from "./components/file-grid";
// import { useUserStore } from "../../../store/user";
// import { getAllArticles } from "./service";

const allFiles = [...Array(100)].map((_, i) => ({
  title: `文档 ${i + 1}`,
  type: (i % 7 === 0 ? "sheet" : "doc") as "sheet" | "doc", // 关键：加上 `as` 强制类型断言
  path: ["我的文档", "Web前端/运营平台", "周报", "技术研发部"][i % 4],
  time: `6月${(i % 30) + 1}日 ${8 + (i % 10)}:0${i % 6}`,
  tag: [null, "企业内公开", "团队可见", "仅自己可见"][i % 4],
  author: "XXX",
}));

const pageSize = 20;

const HomePage: FC = () => {
  const [hoverIndex] = useState<number | null>(null);
  console.log(hoverIndex);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  // const userInfo = useUserStore((state) => state.userInfo);

  const filteredFiles = useMemo(() => {
    const keyword = searchKeyword.trim().toLowerCase();
    return !keyword
      ? allFiles
      : allFiles.filter((file) => file.title.toLowerCase().includes(keyword));
  }, [searchKeyword]);

  const paginatedFiles = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredFiles.slice(start, start + pageSize);
  }, [filteredFiles, currentPage]);

  /*  useEffect(() => {
    if (userInfo) {
      const authorId = userInfo?.id;

      const list = getAllArticles({ authorId });

      console.log(list, "文章列表");
    }
  }, [userInfo]);*/
  return (
    <div className="h-screen bg-white  flex flex-col overflow-auto">
      <HeaderBar />
      <div className="flex flex-1 overflow-y">
        <aside className="w-56 h-full">
          <HomeMenu />
        </aside>

        <main className="flex-1 flex flex-col   px-4 py-6">
          <div className="flex justify-between items-center mb-4 shrink-0">
            <Input
              placeholder="搜索文档标题"
              allowClear
              prefix={<SearchOutlined />}
              className="w-full max-w-sm"
              onChange={(e) => {
                setSearchKeyword(e.target.value);
                setCurrentPage(1);
              }}
            />
            <Button className="ml-4" type="primary">
              + 新建
            </Button>
          </div>

          <div className="flex-1 overflow-auto pb-6">
            <FileGrid
              files={paginatedFiles}
              currentPage={currentPage}
              total={filteredFiles.length}
              pageSize={pageSize}
              onPageChange={(page) => setCurrentPage(page)}
            />
          </div>
        </main>
      </div>
    </div>
  );
};

export default HomePage;
