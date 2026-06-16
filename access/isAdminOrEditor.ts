import type { Access } from "payload";

export const isAdminOrEditor: Access = ({ req: { user } }) =>
  user?.role === "admin" || user?.role === "editor";
