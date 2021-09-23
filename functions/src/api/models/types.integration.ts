export type ConstKeyMapping = {
    const: string;
    key: number;
};

export type ConstKeyChainMapping = {
    const: string;
    keys: string[];
};

export interface MappingFunction {
    inputConsts: string[];
    extras?: any[];
    mappingFunction: (
        inputs: (string | number)[],
        extras: any[],
    ) => (string | number | string[] | number[] | undefined)[];
    outputValKeys: string[];
}

export interface PostMappingFunction {
    inputConsts: string[];
    extras?: any[];
    mappingFunction: (
        inputs: (string | number)[],
        extras: any[],
        allValues: Map<string, (string | number)>[],
    ) => (string | number | string[] | number[] | undefined)[];
    outputValKeys: string[];
}

export interface CallConfig {
    apiFunction: (
        inputs: Map<string, (string | number)>[],
        extras: any[],
    ) => Promise<(string | number | string[] | number[] | undefined)[]>,
    outputValMappings: ConstKeyChainMapping[];
    headers: any;
}
