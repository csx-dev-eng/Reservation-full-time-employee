/**
 * Node-RED settings for the ITP booking bot.
 */

require('dotenv').config();

module.exports = {
  uiPort: process.env.PORT || 1880,
  flowFile: 'flows.json',

  // Persist flow context to disk so conversation state survives restarts
  contextStorage: {
    default: {
      module: 'localfilesystem',
    },
  },

  // Expose env vars to function nodes
  functionGlobalContext: {
    WA_TOKEN: process.env.WA_TOKEN,
    WA_PHONE_NUMBER_ID: process.env.WA_PHONE_NUMBER_ID,
    WA_VERIFY_TOKEN: process.env.WA_VERIFY_TOKEN,
    BRIDGE_URL: process.env.BRIDGE_URL || 'http://localhost:3001',
    STATION_LAT: process.env.STATION_LAT || '46.1866',
    STATION_LON: process.env.STATION_LON || '21.3123',
    STATION_NAME: process.env.STATION_NAME || 'ITP Station',
    STATION_ADDRESS: process.env.STATION_ADDRESS || 'Str. Exemplu Nr. 1, Arad',
  },

  logging: {
    console: {
      level: 'info',
      metrics: false,
      audit: false,
    },
  },
};
