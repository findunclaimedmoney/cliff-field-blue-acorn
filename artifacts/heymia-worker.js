import { appPage } from "./src/ui.js";
import { handleRequest } from "./src/api.js";

export default {
  async fetch(request, env, ctx) {
    return handleRequest(request, env, ctx);
  }
};
