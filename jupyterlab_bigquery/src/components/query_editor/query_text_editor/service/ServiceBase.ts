/**
 * Singleton base class.
 *
 * TODO: Add cache.
 */
class ServiceBase {
  private static instance: ServiceBase;

  constructor() {
    // eslint-disable-next-line no-extra-boolean-cast
    if (!!ServiceBase.instance) {
      return ServiceBase.instance;
    }

    ServiceBase.instance = this;

    return this;
  }
}

export default ServiceBase;
