import FlakeId from "flake-idgen";
import intformat from "biguint-format";

const flake = new FlakeId();

/**
 * 生成雪花 ID（唯一，数据库存储用）
 */
export const generateSnowflakeId = (): string => {
  return intformat(flake.next(), "dec"); // 返回 string，防止 JS 精度丢失
};

/**
 * 生成 8 位短 ID（前端显示用）
 */
export const generateShortId = (): string => {
  const timestamp = Date.now().toString().slice(-5); // 时间戳后 5 位
  const random = Math.floor(Math.random() * 1000) // 3 位随机数
    .toString()
    .padStart(3, "0");

  return `${timestamp}${random}`; // 总共 8 位
};
