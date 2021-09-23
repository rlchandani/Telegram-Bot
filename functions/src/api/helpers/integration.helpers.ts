import _ from "lodash";
import { CallConfig, ConstKeyChainMapping } from "../models/types.integration";
import { firebaseConfig } from "../../helper/firebase_config";

function mergeArrayObjects(key: string, arr1: any[], arr2: any[]): Map<string, string | number>[] {
  if (arr2.length > 0) {
    return arr1.map((item, i) => {
      if (item.get(key) === arr2[i].get(key)) {
        return new Map([...item, ...arr2[i]]);
      }
      return new Map([]);
    });
  }
  return arr1;
}

export async function reduceCallResultsIntoMap(
  key: string,
  constMap: Map<string, (string | number)>[],
  callConfigs: CallConfig[]
): Promise<Map<string, string | number>[]> {
  let constMapVar: Map<string, string | number>[] = constMap;
  for (const callConfig of callConfigs) {
    const newConstMapVar = await makeExternalCall(constMapVar, callConfig)
      .then((entries) => entries.map((entry) => new Map<string, string | number>([...entry])));
    constMapVar = mergeArrayObjects(key, constMapVar, newConstMapVar);
  }
  return constMapVar;
}

export async function makeExternalCall(
  constMap: Map<string, string | number>[],
  callConfig: CallConfig
): Promise<[string, string | number][][]> {
  return await callConfig.apiFunction(constMap, [{ credentials: firebaseConfig.robinhood }])
    .then((results) => {
      return results
        .map((result: any) => callConfig.outputValMappings
          .map((mapping: any) => [mapping.const, _.get(result, mapping.keys)]));
    });
}

// export async function makeExternalCall(
//   constMap: Map<string, string | number>,
//   callConfig: CallConfig
// ): Promise<[string, string | number][]> {
//   // replace wildcards
//   const newPath = replaceWildcards(callConfig.pathTemplate, constMap);
//   // make call and store values in constMap
//   const requestConfig = {
//     url: callConfig.baseUrl + newPath,
//     headers: callConfig.headers
//   };

//   return getAxios(requestConfig)
//     .then((response: any) => callConfig
//       .outputValMappings
//       .map((mapping: any) => [mapping.const, _.get(response.data, mapping.keys)]));
// }

export function getKeysFromMappings(data: any, mappings: ConstKeyChainMapping[]): [string, string][] {
  return mappings.map((mapping) => [mapping.const, _.get(data, mapping.keys)]);
}

export function replaceWildcards(template: string, map: Map<string, string | number>): string {
  let newUrl = template;
  map.forEach((value, key) => {
    newUrl = newUrl.replace("{" + key + "}", String(value));
  });
  return newUrl;
}
