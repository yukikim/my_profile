import type { Access } from "payload";

export const isAdminEditorOrAuthor: Access = ({ req: { user } }) =>
  user?.role === "admin" || user?.role === "editor" || user?.role === "author";
