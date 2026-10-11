import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { AuthUser } from "./types";
import type { Role } from "@/lib/constants";
import type { Student } from "@/types/student";

type AuthContextValue = {
  user: AuthUser | null;
  signInAs: (role: Role) => void;
  signInAsStudent: (student: Student) => void;
  signOut: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

const MOCK_USERS: Record<Role, AuthUser> = {
  super_admin: {
    id: "u-admin",
    email: "admin@supreme.edu.gh",
    fullName: "Kwame Mensah",
    role: "super_admin",
  },
  headmaster: {
    id: "u-head",
    email: "head@supreme.edu.gh",
    fullName: "Akosua Boateng",
    role: "headmaster",
  },
  teacher: {
    id: "u-teach",
    email: "teacher@supreme.edu.gh",
    fullName: "Yaw Owusu",
    role: "teacher",
  },
  secretary: {
    id: "u-sec",
    email: "sec@supreme.edu.gh",
    fullName: "Abena Asante",
    role: "secretary",
  },
  student: {
    id: "u-stu",
    email: "kofi.adjei@supreme.edu.gh",
    fullName: "Kofi Adjei",
    role: "student",
    studentId: "stu-001",
  },
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      signInAs: (role) => setUser(MOCK_USERS[role]),
      signInAsStudent: (student) =>
        setUser({
          id: `u-stu-${student.id}`,
          email: "",
          fullName: `${student.firstName} ${student.lastName}`,
          role: "student",
          studentId: student.id,
        }),
      signOut: () => setUser(null),
    }),
    [user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
