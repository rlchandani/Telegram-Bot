import { MappingFunction, PostMappingFunction } from "../models/types.integration";

export function executeMappingFunctions(constMap: Map<string, string | number>[] = [], mappingFunctions: MappingFunction[]) {
  return constMap.map((constMapEntry) => {
    return mappingFunctions.reduce((map, mappingFunction) => {
      const inputs = mappingFunction.inputConsts.map((key: any) => map.get(key) as (string | number));
      const extras = mappingFunction?.extras || [];
      const returnedValues: any[] = mappingFunction.mappingFunction(inputs, extras);
      const newEntries: [string, string | number][] = mappingFunction.outputValKeys
        .map((key, index) => [key, returnedValues[index]]);
      const existingEntries = Array.from(map.entries());
      return new Map<string, string | number>([
        ...existingEntries,
        ...newEntries
      ]);
    }, constMapEntry);
  });
}

export function executePostMappingFunctions(constMap: Map<string, string | number>[] = [], postMappingFunctions: PostMappingFunction[]) {
  return constMap.map((constMapEntry) => {
    return postMappingFunctions.reduce((map, postMappingFunction) => {
      const inputs = postMappingFunction.inputConsts.map((key: any) => map.get(key) as (string | number));
      const extras = postMappingFunction?.extras || [];
      const returnedValues: any[] = postMappingFunction.mappingFunction(inputs, extras, constMap);
      const newEntries: [string, string | number][] = postMappingFunction.outputValKeys
        .map((key, index) => [key, returnedValues[index]]);
      const existingEntries = Array.from(map.entries());
      return new Map<string, string | number>([
        ...existingEntries,
        ...newEntries
      ]);
    }, constMapEntry);
  });
}
