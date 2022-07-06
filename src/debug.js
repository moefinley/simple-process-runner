import { getConfig } from "./config.mjs";
export function log(message) {
    if (getConfig().debug)
        console.log(message);
}
//# sourceMappingURL=debug.js.map