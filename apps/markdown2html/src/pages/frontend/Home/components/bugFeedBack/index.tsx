// components/BugFeedbackButton.tsx - 简约版
import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { MessageCircle, ExternalLink } from "lucide-react";
import { Popover } from "antd";

const BugFeedbackButton: React.FC = () => {
  const [open, setOpen] = useState(false);
  const qqGroupUrl = "https://qm.qq.com/q/uqL3DDHNFo";

  const content = (
    <div className="w-64 p-4">
      <div className="text-center mb-4">
        <h3 className="font-medium text-gray-900 mb-1">反馈与交流</h3>
        <p className="text-xs text-gray-500">扫码加入QQ群</p>
      </div>

      <div className="flex flex-col items-center mb-4">
        <div className="bg-white p-2 rounded-lg border border-gray-200">
          <QRCodeSVG
            value={qqGroupUrl}
            size={120}
            level="H"
            fgColor="#3b82f6"
            bgColor="#ffffff"
          />
        </div>
        <p className="text-xs text-gray-600 mt-3">MarkdownOnline Bug反馈群</p>
      </div>

      <a
        href={qqGroupUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center gap-2 w-full py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors text-sm"
        onClick={() => setOpen(false)}
      >
        <ExternalLink className="w-3.5 h-3.5" />
        加入群聊
      </a>
    </div>
  );

  return (
    <Popover
      content={content}
      title={null}
      trigger="hover"
      open={open}
      onOpenChange={setOpen}
      placement="leftTop"
    >
      <button
        className="fixed bottom-6 right-6 w-10 h-10 bg-gray-100 text-gray-600 rounded-full hover:bg-gray-200 transition-colors flex items-center justify-center shadow-sm hover:shadow z-50"
        aria-label="反馈"
      >
        <MessageCircle className="w-4 h-4" />
      </button>
    </Popover>
  );
};

export default BugFeedbackButton;
