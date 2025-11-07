import { type FC } from "react";

const LoadingPage: FC = () => {
  return (
    <div className="flex items-center justify-center h-screen bg-gray-50">
      <div className="flex flex-col items-center">
        <svg
          className="h-16 w-16 mb-4"
          viewBox="0 0 50 50"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          stroke="url(#gradient)"
          strokeWidth="4"
          strokeLinecap="round"
          style={{ animation: "rotate 2s linear infinite" }}
        >
          <defs>
            <linearGradient id="gradient" x1="1" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3b82f6" />
              <stop offset="100%" stopColor="#2563eb" />
            </linearGradient>
          </defs>
          <circle
            cx="25"
            cy="25"
            r="20"
            strokeDasharray="90"
            strokeDashoffset="60"
            style={{ animation: "dash 1.5s ease-in-out infinite" }}
          />
        </svg>
        <p className="text-gray-700 text-lg font-medium select-none">
          <span>加载中</span>
          <span className="loading-dots">
            <span>.</span>
            <span>.</span>
            <span>.</span>
          </span>
        </p>

        <style>{`
          @keyframes rotate {
            100% {
              transform: rotate(360deg);
            }
          }
          @keyframes dash {
            0% {
              stroke-dasharray: 1, 150;
              stroke-dashoffset: 0;
            }
            50% {
              stroke-dasharray: 90, 150;
              stroke-dashoffset: -35;
            }
            100% {
              stroke-dasharray: 90, 150;
              stroke-dashoffset: -124;
            }
          }
          .loading-dots {
            display: inline-block;
          }
          .loading-dots span {
            animation: dot-blink 1.5s infinite;
            opacity: 0;
          }
          .loading-dots span:nth-child(1) {
            animation-delay: 0s;
          }
          .loading-dots span:nth-child(2) {
            animation-delay: 0.5s;
          }
          .loading-dots span:nth-child(3) {
            animation-delay: 1s;
          }
          @keyframes dot-blink {
            0%, 20% {
              opacity: 0;
            }
            50% {
              opacity: 1;
            }
            100% {
              opacity: 0;
            }
          }
        `}</style>
      </div>
    </div>
  );
};

export default LoadingPage;
