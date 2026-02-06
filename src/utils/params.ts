// Helper function to safely get a single string from a parameter that could be string | string[]
export const getParamAsString = (param: string | string[] | undefined): string => {
    if (Array.isArray(param)) {
        return param[0] || "";
    }
    return param || "";
};

// Helper function to parse query parameter as string
export const getQueryAsString = (query: unknown): string | undefined => {
    if (typeof query === "string") {
        return query;
    }
    if (Array.isArray(query) && typeof query[0] === "string") {
        return query[0];
    }
    return undefined;
};

// Helper function to parse query parameter as number
export const getQueryAsNumber = (query: unknown): number | undefined => {
    const str = getQueryAsString(query);
    if (str === undefined) return undefined;
    const num = parseFloat(str);
    return isNaN(num) ? undefined : num;
};

// Helper function to parse query parameter as boolean
export const getQueryAsBoolean = (query: unknown): boolean | undefined => {
    const str = getQueryAsString(query);
    if (str === undefined) return undefined;
    return str === "true";
};

// Helper function to parse query parameter as Date
export const getQueryAsDate = (query: unknown): Date | undefined => {
    const str = getQueryAsString(query);
    if (str === undefined) return undefined;
    const date = new Date(str);
    return isNaN(date.getTime()) ? undefined : date;
};
