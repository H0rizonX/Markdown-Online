import { useEffect } from "react";

interface NoticeModalProps {
  open: boolean;
  onClose: () => void;
}

export default function NoticeModal({ open, onClose }: NoticeModalProps) {
  // ESC 关闭
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-xl p-6 max-w-md w-11/12 animate-scaleIn"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-semibold text-gray-800 mb-3 text-center">
          网站公告
        </h2>

        <p className="text-gray-600 leading-relaxed text-sm">
          当前平台主要用于测试 <strong>协同编辑连接</strong> 与{" "}
          <strong>语音功能</strong>。
          其他功能仍在开发与调试中，目前暂不支持内容保存或持久化处理。
          感谢您的理解与支持，敬请期待后续更新！
        </p>

        <div className="mt-6 flex justify-center">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition"
          >
            我知道了
          </button>
        </div>
      </div>

      {/* Animations */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0 }
          to { opacity: 1 }
        }
        @keyframes scaleIn {
          from { transform: scale(0.9); opacity: 0 }
          to { transform: scale(1); opacity: 1 }
        }
        .animate-fadeIn { animation: fadeIn .2s ease-out }
        .animate-scaleIn { animation: scaleIn .25s ease-out }
      `}</style>
    </div>
  );
}
