declare module "../../admin/dist/router.js" {
  import type { Router } from "express";
  export function createAdminRouter(basePath?: string): Router;
}
