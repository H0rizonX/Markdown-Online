import "./index.scss";
import { useEffect, useState, type FC } from "react";
import type { componentProps } from "../../interface.ts";
import { message } from "antd";

const Tiptap: FC<componentProps> = (props) => {
  const { isExpended } = props;
  const [messageApi, contextHolder] = message.useMessage();
  const [isSaving, setIsSaving] = useState(false);
  const saveData = async () => {
    setIsSaving(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      messageApi.open({
        type: "success",
        content: "保存成功",
      });
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s") {
        event.preventDefault();
        // 执行保存逻辑
        saveData();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    // 组件卸载时解绑事件
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  return (
    <div
      className={`
        h-full px-10 mt-5 flex items-center justify-center transition-all duration-1000 ease-in-out
        ${isExpended ? "w-[1200px] -ml-[200px]" : "w-[1000px] ml-0"}
      `}
    >
      {contextHolder}
      {isSaving && (
        <div className="fixed inset-0 z-50 bg-white/60 backdrop-blur-sm flex items-center justify-center">
          <div className="flex flex-col items-center">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <div className="mt-2 text-gray-700 text-sm">正在保存中...</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Tiptap;
