import _ from "lodash";
import HyderationConfig from "../configs/hyderation.config";
import { reduceCallResultsIntoMap, replaceWildcards } from "./integration.helpers";
import { Config, DisplayConfig, NodeHydrationValues } from "../models/types.hydration";
import { executeMappingFunctions, executePostMappingFunctions } from "./url.helpers";

export async function generateHydrationValues(symbols: string[]): Promise<NodeHydrationValues[]> {
  const externalSystemId = "Robinhood";
  let stripSPY = false;
  let results: NodeHydrationValues[] = [{}];
  const config: Config | undefined = HyderationConfig.find((config) => config.resourceIdentifier.externalSystem === externalSystemId);
  if (config) {
    if (!symbols.includes("SPY")) {
      symbols.push("SPY");
      stripSPY = true;
    }
    results = await parseConfigAndSpec(symbols.map((symbol) => new Map([["symbol", symbol]])), config)
      .then((results: NodeHydrationValues[]) => results.filter((entry: NodeHydrationValues) => entry.appendix?.symbol !== undefined));
  }
  if (stripSPY) {
    symbols.pop();
    return results.filter((entry: NodeHydrationValues) => entry.appendix?.symbol !== "SPY");
  }
  return results;
}

export async function parseConfigAndSpec(symbols: Map<string, (string | number)>[], config: Config): Promise<NodeHydrationValues[]> {
  let constMap: Map<string, (string | number)>[] = symbols;
  if (config.callConfigs) {
    constMap = await reduceCallResultsIntoMap(config.resourceIdentifier.key, constMap, config.callConfigs);
  }
  if (config.mappingFunctions) {
    constMap = executeMappingFunctions(constMap, config.mappingFunctions);
  }
  if (config.postMappingFunctions) {
    constMap = executePostMappingFunctions(constMap, config.postMappingFunctions);
  }

  return createDisplayParameters(constMap, config.displayConfig);
}

export function createDisplayParameters(
  constMap: Map<string, string | number>[],
  displayConfig: DisplayConfig
): NodeHydrationValues[] {
  return constMap.map((constMapEntry) => {
    const externalLink = replaceWildcards(displayConfig.externalLink, constMapEntry);
    let displayName = undefined;
    if (displayConfig.displayName) {
      displayName = constMapEntry.get(displayConfig.displayName)?.toString();
    }
    const displayValues = displayConfig.displayValues.map((mapping: any) => {
      const displayName = mapping.displayName;
      const displayValue = constMapEntry.get(mapping.constName);
      if (_.isUndefined(displayValue)) {
        console.log("Value not found for constant " + mapping.constName);
        return {
          name: displayName,
          value: "Not Found"
        };
      }
      return {
        name: displayName,
        value: displayValue?.toString()
      };
    });
    const appendix: Record<string, any> = {};
    if (displayConfig.appendix) {
      displayConfig.appendix.forEach((item: any) => (appendix[item] = constMapEntry.get(item)));
    }
    return {
      displayName,
      displayValues,
      externalLink,
      appendix
    };
  });
}
