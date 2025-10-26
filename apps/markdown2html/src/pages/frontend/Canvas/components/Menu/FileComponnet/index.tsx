import { FileText } from "lucide-react";
import { type FC } from "react";
import type { fileProps } from "./interface";

const FileComponent: FC<fileProps> = (props) => {
  const { FileName } = props;

  return (
    <div className="w-260px h-10 flex flex-row justify-around items-center">
      <FileText />
      {FileName}
    </div>
  );
};

export default FileComponent;
