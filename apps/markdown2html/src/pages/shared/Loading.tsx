import { useState, useEffect, type FC } from "react";

const LoadingPage: FC = () => {
  const [dots, setDots] = useState("");

  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prev) => (prev.length < 3 ? prev + "." : ""));
    }, 500);
    return () => clearInterval(interval);
  }, []);

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
          加载中{dots}
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
        `}</style>
      </div>
    </div>
  );
};

export default LoadingPage;
