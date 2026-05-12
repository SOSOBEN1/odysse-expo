// app/frontend/constants/MissionStatusContext.tsx

import { createContext, useCallback, useContext, useState } from "react";
import type { ReactNode } from "react";

interface StatusModal {
  visible: boolean;
  type: "success" | "fail";
  missionTitle?: string;
  dateLimit?: string;
  xp: number;
  coins: number;
}

interface MissionStatusContextType {
  statusModal: StatusModal;
  showStatusModal: (modal: Omit<StatusModal, "visible">) => void;
  closeStatusModal: () => void;
}

const MissionStatusContext = createContext<MissionStatusContextType | null>(null);

export function MissionStatusProvider({ children }: { children: ReactNode }) {
  const [statusModal, setStatusModal] = useState<StatusModal>({
    visible: false,
    type: "success",
    missionTitle: undefined,
    dateLimit: undefined,
    xp: 0,
    coins: 0,
  });

  const showStatusModal = useCallback((modal: Omit<StatusModal, "visible">) => {
    setStatusModal({ ...modal, visible: true });
  }, []);

  const closeStatusModal = useCallback(() => {
    setStatusModal((prev) => ({ ...prev, visible: false }));
  }, []);

  return (
    <MissionStatusContext.Provider value={{ statusModal, showStatusModal, closeStatusModal }}>
      {children}
    </MissionStatusContext.Provider>
  );
}

export function useMissionStatus() {
  const ctx = useContext(MissionStatusContext);
  if (!ctx) throw new Error("useMissionStatus must be used within MissionStatusProvider");
  return ctx;
}