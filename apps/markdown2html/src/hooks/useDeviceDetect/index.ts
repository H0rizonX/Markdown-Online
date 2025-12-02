import { useState, useEffect } from "react";

export const useDeviceDetect = () => {
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const checkDevice = () => {
      const width = window.innerWidth;

      // 响应式断点
      const mobile = width < 768; // 手机
      const tablet = width >= 768 && width < 1024; // 平板
      const desktop = width >= 1024; // 桌面

      setIsMobile(mobile);
      setIsTablet(tablet);
      setIsDesktop(desktop);
    };

    checkDevice();
    window.addEventListener("resize", checkDevice);
    return () => window.removeEventListener("resize", checkDevice);
  }, []);

  const deviceType = isMobile ? "mobile" : isTablet ? "tablet" : "desktop";

  return {
    isMobile,
    isTablet,
    isDesktop,
    deviceType,
    requireDesktop: !isDesktop, // 是否需要桌面端
  };
};
