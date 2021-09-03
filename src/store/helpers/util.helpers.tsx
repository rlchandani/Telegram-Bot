import jp from "jsonpath";
import { RealtimeDatabase } from "../../models/types.realtimeDatabase";

const merge = (target: any, source: any) => {
  // Iterate through `source` properties and if an `Object` set property to merge of `target` and `source` properties
  for (const key of Object.keys(source)) {
    if (source[key] instanceof Object && key in target) Object.assign(source[key], merge(target[key], source[key]));
  }

  // Join `target` and modified `source`
  Object.assign(target || {}, source);
  return target;
};

const putProcessor = (state: any, payload: RealtimeDatabase.StreamPayload) => {
  if (payload.path === "/") {
    return payload.data;
  }
  return patchProcessor(state, payload);
};

const patchProcessor = (state: any, payload: RealtimeDatabase.StreamPayload) => {
  const path = payload.path;
  const data = payload.data;
  const clone = { ...state.data };
  const existingNode = jp.query(clone, `$${path.replaceAll("/", ".")}`);
  if (existingNode.length === 0) {
    // Creating new path
    const pathList = path.split("/").filter((x: string) => x !== "");
    const newPath = {};
    pathList.reduce(function (o: any, s: any) {
      return (o[s] = {});
    }, newPath);
    merge(clone, newPath);
  }
  jp.apply(clone, `$${path.replaceAll("/", ".")}`, (value) => {
    return Object.assign(value, data);
  });
  return clone;
};

export { merge, putProcessor, patchProcessor };
