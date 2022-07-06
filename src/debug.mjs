import { getConfig } from "./config.mjs";
export function log(...messages) {
    if (getConfig().debug)
        console.log(...messages);
}
//# sourceMappingURL=debug.mjs.map