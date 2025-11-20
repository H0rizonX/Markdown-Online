import OSS from "ali-oss";
import { env } from "./env";

const canInit =
  env.oss.enable &&
  !!env.oss.region &&
  !!env.oss.accessKeyId &&
  !!env.oss.accessKeySecret &&
  !!env.oss.bucket;

if (!canInit) {
  console.warn("⚠️ OSS 未配置完整，相关上传功能将不可用");
}

const ossClient = canInit
  ? new OSS({
      region: env.oss.region,
      accessKeyId: env.oss.accessKeyId,
      accessKeySecret: env.oss.accessKeySecret,
      bucket: env.oss.bucket,
    })
  : ({
      async put() {
        throw new Error("阿里云 OSS 未配置，上传失败");
      },
    } as unknown as OSS);

export default ossClient;
