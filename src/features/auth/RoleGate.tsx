import type { ReactNode } from "react";
import { useAuth } from "./AuthContext";
import { can, type Resource, type Action } from "@/lib/permissions";
import type { Role } from "@/lib/constants";

type Props = {
  /** Require the user to have a specific action on a resource. */
  resource?: Resource;
  action?: Action;
  /** Or require one of these roles directly (escape hatch). */
  roles?: Role[];
  /** What to render when the user does not qualify. */
  fallback?: ReactNode;
  children: ReactNode;
};

export function RoleGate({
  resource,
  action,
  roles,
  fallback = null,
  children,
}: Props) {
  const { user } = useAuth();
  if (!user) return <>{fallback}</>;

  if (roles && !roles.includes(user.role)) return <>{fallback}</>;
  if (resource && action && !can(user.role, resource, action))
    return <>{fallback}</>;

  return <>{children}</>;
}
