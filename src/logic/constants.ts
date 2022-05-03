export const GLOBAL_ACCOUNT = "Global";
export const PHYSICAL_ACCOUNT = "Physical";
export const VIRTUAL_ACCOUNT = "Virtual";

export const SCHEDULER_HOST = process.env.PRODUCTION ? "scheduler" : "localhost"
export const ENGINE_HOST = process.env.PRODUCTION ? "engine" : "localhost"

export const SCHEDULER_PORT = "3002"
export const ENGINE_PORT = "3000"
