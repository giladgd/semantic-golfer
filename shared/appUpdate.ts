export type AppUpdate = {
    status: "checking" | "available" | "downloading" | "installing" | "current" | "error",
    version?: string,
    progress?: number,
    manual?: string,
    error?: string,
    dismissed?: boolean
};
