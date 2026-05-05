import { getConfig } from '../../config.js';

async function getServerConfig() {
  const config = getConfig();
  return {
    basePath: config.BASE_PATH,
  };
}

export { getServerConfig };
