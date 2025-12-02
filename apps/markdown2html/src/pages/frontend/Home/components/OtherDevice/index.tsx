import {
  Laptop,
  Monitor,
  MousePointer2,
  QrCode,
  MessageSquare,
  Users,
  ExternalLink,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import type { FC } from "react";

const DeviceDetect: FC = () => {
  const qqGroupUrl = "https://qm.qq.com/q/uqL3DDHNFo";
  const qqGroupName = "MarkdownOnline Bug反馈群";

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white rounded-2xl shadow-xl p-8 text-center">
        {/* 顶部标题区域 */}
        <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-100 rounded-full mb-6">
          <Monitor className="w-10 h-10 text-blue-600" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          请使用电脑浏览器访问
        </h1>
        <p className="text-gray-600 mb-8 text-lg">
          为了获得最佳编辑体验，本编辑器暂不支持移动端。
          请使用电脑或平板（横屏模式）访问。
        </p>

        {/* 功能说明区域 */}
        <div className="space-y-4 mb-8">
          <div className="flex items-center justify-center gap-4">
            <div className="flex items-center gap-2">
              <Laptop className="w-5 h-5 text-green-600" />
              <span className="text-gray-700">推荐分辨率：1920×1080</span>
            </div>
          </div>
          <div className="flex items-center justify-center gap-4">
            <div className="flex items-center gap-2">
              <MousePointer2 className="w-5 h-5 text-purple-600" />
              <span className="text-gray-700">支持鼠标拖拽操作</span>
            </div>
          </div>
        </div>

        {/* QQ群二维码区域 */}
        <div className="border-t pt-8">
          <div className="flex items-center gap-2 mb-6 justify-center">
            <MessageSquare className="w-5 h-5 text-blue-500" />
            <h3 className="text-lg font-medium text-gray-800">
              加入QQ群获取最新动态
            </h3>
          </div>

          <div className="flex flex-col lg:flex-row items-center lg:items-start gap-8 justify-center mb-6">
            {/* 左侧：二维码区域 */}
            <div className="relative">
              <div className="bg-white p-4 rounded-xl shadow-lg border border-blue-100">
                <div className="relative">
                  <QRCodeSVG
                    value={qqGroupUrl}
                    size={180}
                    level="H" // 容错级别：L(7%), M(15%), Q(25%), H(30%)
                    includeMargin={false}
                    fgColor="#1e40af" // 深蓝色
                    bgColor="#ffffff"
                    className="rounded-lg"
                  />

                  {/* 中间logo */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-12 h-12 bg-white rounded-full border-2 border-blue-500 flex items-center justify-center shadow-sm">
                      <QrCode className="w-6 h-6 text-blue-600" />
                    </div>
                  </div>
                </div>

                {/* 群聊标识 */}
                <div className="absolute -bottom-3 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white text-xs px-4 py-1.5 rounded-full shadow-md whitespace-nowrap">
                  QQ群
                </div>
              </div>
            </div>

            {/* 右侧：说明区域 */}
            <div className="max-w-xs text-left">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <Users className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">Bug反馈群</h4>
                    <p className="text-sm text-gray-600 mt-1">
                      加入【{qqGroupName}】，与开发者直接交流
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                    <MessageSquare className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">获取最新通知</h4>
                    <p className="text-sm text-gray-600 mt-1">
                      第一时间获取移动端上线通知和功能更新
                    </p>
                  </div>
                </div>
              </div>

              {/* 直接加入链接 */}
              <a
                href={qqGroupUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 mt-6 px-5 py-2.5 bg-gray-900 text-white rounded-lg hover:bg-black transition-colors shadow-sm w-full justify-center"
              >
                <ExternalLink className="w-4 h-4" />
                <span>点击直接加入群聊</span>
              </a>
            </div>
          </div>

          {/* 操作说明 */}
          <div className="border-t pt-6">
            <div className="flex items-center justify-center space-x-6 mb-4">
              <div className="flex flex-col items-center">
                <div className="w-8 h-8 rounded-full bg-gray-800 text-white flex items-center justify-center text-sm font-medium">
                  1
                </div>
                <p className="text-xs text-gray-600 mt-2">QQ扫码</p>
              </div>
              <div className="text-gray-300 text-lg">→</div>
              <div className="flex flex-col items-center">
                <div className="w-8 h-8 rounded-full bg-gray-800 text-white flex items-center justify-center text-sm font-medium">
                  2
                </div>
                <p className="text-xs text-gray-600 mt-2">加入群聊</p>
              </div>
              <div className="text-gray-300 text-lg">→</div>
              <div className="flex flex-col items-center">
                <div className="w-8 h-8 rounded-full bg-gray-800 text-white flex items-center justify-center text-sm font-medium">
                  3
                </div>
                <p className="text-xs text-gray-600 mt-2">获取通知</p>
              </div>
            </div>

            <p className="text-xs text-gray-500">
              如果二维码无法识别，请复制链接到QQ打开：
              <br />
              <code className="text-blue-600 break-all text-sm mt-1 inline-block">
                {qqGroupUrl}
              </code>
            </p>
          </div>
        </div>

        {/* 返回按钮 */}
        <div className="border-t pt-6 mt-6">
          <button
            onClick={() => window.history.back()}
            className="px-8 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-md"
          >
            返回上一页
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeviceDetect;
