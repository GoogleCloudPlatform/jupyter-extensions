import { requestAPI } from './api_request';

export interface Service {
  serviceName: string;
  producerProjectId: string;
}

export interface Services {
  services: Service[];
}

export abstract class ManagementService {
  static async listManagedServices(): Promise<Service[]> {
    const data = (await requestAPI<Services>('v1/managedServices')).services;
    return data;
  }
  static async getProject(): Promise<string> {
    const data = await requestAPI<string>('v1/project');
    return data;
  }
}
