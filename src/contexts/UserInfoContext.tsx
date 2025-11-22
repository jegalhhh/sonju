import { createContext, useContext, useState, ReactNode } from "react";

interface UserInfo {
  age: number;
  gender: "male" | "female";
  height: number;
  weight: number;
}

interface UserInfoContextType {
  userInfo: UserInfo | null;
  setUserInfo: (info: UserInfo | null) => void;
}

const UserInfoContext = createContext<UserInfoContextType | undefined>(undefined);

export const UserInfoProvider = ({ children }: { children: ReactNode }) => {
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);

  return (
    <UserInfoContext.Provider value={{ userInfo, setUserInfo }}>
      {children}
    </UserInfoContext.Provider>
  );
};

export const useUserInfo = () => {
  const context = useContext(UserInfoContext);
  if (context === undefined) {
    throw new Error("useUserInfo must be used within a UserInfoProvider");
  }
  return context;
};
