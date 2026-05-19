declare module "@hardware/admin/router" {
  import type { Router } from "express";
  export function createAdminRouter(basePath?: string): Router;
}
