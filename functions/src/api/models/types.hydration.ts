import { CallConfig, MappingFunction, PostMappingFunction } from "./types.integration";

export interface ResourceIdentifier {
    externalSystem: string;
    key: string;
}

export interface DisplayValConfig {
    displayName: string;
    constName: string;
}

export interface DisplayConfig {
    displayName?: string;
    displayValues: DisplayValConfig[];
    externalLink: string;
    appendix?: string[];
}


export interface NodeHydrationValues {
    displayName?: string;
    displayValues?: { name: string; value: string }[];
    buttonName?: string;
    specialButtonName?: string;
    externalLink?: string;
    appendix?: Record<string, any>;
}

export interface Config {
    resourceIdentifier: ResourceIdentifier;
    callConfigs?: CallConfig[];
    mappingFunctions?: MappingFunction[];
    postMappingFunctions?: PostMappingFunction[];
    displayConfig: DisplayConfig;
}
