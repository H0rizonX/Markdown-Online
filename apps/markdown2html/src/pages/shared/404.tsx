import type { FC } from "react";

const NotFound: FC = () => {
  return (
    <div className="py-10 bg-white font-sans text-center">
      <div
        className="h-96 bg-no-repeat bg-center"
        style={{
          backgroundImage:
            "url('https://cdn.dribbble.com/users/285475/screenshots/2083086/dribbble_1.gif')",
        }}
      >
        <h1 className="text-8xl text-black">404</h1>
      </div>
      <div className="-mt-12">
        <h3 className="text-2xl text-gray-800">看起来你迷路了</h3>
        <p className="text-lg text-gray-600">您查找的页面不存在！</p>
        <a
          href="/"
          className="inline-block mt-5 px-6 py-2 bg-blue-400 text-white rounded-md hover:bg-blue-500 transition"
        >
          返回首页
        </a>
      </div>
    </div>
  );
};

export default NotFound;
