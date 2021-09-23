import { logger } from "firebase-functions";
import * as registeredGroupDao from "../dao/registeredGroup.dao";
import { registerOptions } from "../model/registerAction.model";


const addGroup = async (groupId: any, groupInfo: any, registeredBy: any, date: any, enabled: boolean = false) => {
  try {
    if (await registeredGroupDao.add(groupId, groupInfo, registeredBy, date, enabled)) {
      logger.info(`Group registered: ${groupId}`);
    }
  } catch (err) {
    logger.error(`Group failed to register for Id: ${groupId}.`, err);
    throw err;
  }
};

const getAllGroups = async (filterOnService?: any) => {
  const snapshot = await registeredGroupDao.getAll();
  if (snapshot !== null) {
    if (filterOnService !== undefined) {
      return Object.keys(snapshot)
        .filter((groupId) => {
          const group = snapshot[groupId];
          return group.service !== undefined && group.service[filterOnService] === true;
        })
        .map((groupId) => snapshot[groupId]);
    } else {
      return Object.keys(snapshot)
        .filter((groupId) => snapshot[groupId].enabled === true)
        .map((groupId) => snapshot[groupId]);
    }
  }
  logger.info("No group(s) found");
  return [];
};

const getGroupById = async (groupId: any) => {
  const snapshot = await registeredGroupDao.get(groupId);
  if (snapshot !== null) {
    return snapshot;
  }
  logger.info(`No group found with id: ${groupId}`);
  return {};
};

const deRegisteredGroup = async (groupId: any) => {
  const promises: Promise<void>[] = [];
  registerOptions.forEach((optionGroup) =>
    optionGroup.forEach((option) => {
      promises.push(disableServiceForGroup(groupId, option.action));
    }));
  await Promise.all(promises);
};

const enableServiceForGroup = async (groupId: any, serviceName: any) => {
  try {
    registeredGroupDao.enableService(groupId, serviceName);
    logger.log(`Service ${serviceName} enabled on groupId:`, groupId);
  } catch (err) {
    logger.error(`Group failed to enable service: ${serviceName} for Id: ${groupId}.`, err);
    throw err;
  }
};

const disableServiceForGroup = async (groupId: any, serviceName: string) => {
  try {
    registeredGroupDao.disableService(groupId, serviceName);
    logger.log(`Service ${serviceName} disabled on groupId:`, groupId);
  } catch (err) {
    logger.error(`Group failed to disable service: ${serviceName} for Id: ${groupId}.`, err);
    throw err;
  }
};

const getGroupServiceStatus = async (groupId: any) => {
  const group = await getGroupById(groupId);
  const services = group.service;
  const response: { [key: string]: string } = {};
  registerOptions.forEach((optionGroup) =>
    optionGroup.forEach((option) => {
      if (services === undefined) {
        response[option.name] = "Disabled";
      } else {
        response[option.name] = services[option.action] === false || services[option.action] === undefined ? "Disabled" : "Enabled";
      }
    }));
  return response;
};

const checkIfServiceActiveOnGroup = async (groupId: any, serviceName: string | number) => {
  const group = await getGroupById(groupId);
  const services = group.service;
  if (services !== undefined && services[serviceName] !== null && services[serviceName] === true) {
    return true;
  }
  return false;
};

const checkIfGroupExist = async (groupId: any) => {
  try {
    await getGroupById(groupId);
    return true;
  } catch (err) {
    return false;
  }
};

export {
  addGroup,
  getAllGroups,
  getGroupById,
  deRegisteredGroup,
  enableServiceForGroup,
  disableServiceForGroup,
  getGroupServiceStatus,
  checkIfServiceActiveOnGroup,
  checkIfGroupExist
};
