import React from "react";
import FieldManual from "../../../shared/ui/FieldManual";

interface DetailPaneProps {
  isOpen: boolean;
  onClose: () => void;
}

const DetailPane: React.FC<DetailPaneProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="hidden lg:flex flex-col relative w-[60%] shrink-0 border-l border-app-border bg-app-canvas z-10 h-full">
      <div className="absolute inset-0">
          <FieldManual isOpen={isOpen} onClose={onClose} inline={true} />
      </div>
    </div>
  );
};

export default DetailPane;
