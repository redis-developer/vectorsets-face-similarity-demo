import { createClient } from 'redis';

import { logInfo, logError } from './logger.js';
import { REDIS_ALLOWED_COMMANDS } from './constants.js';
type RedisClientType = ReturnType<typeof createClient>;

function isCommandAllowed(commandKeyword: string) {
  let isAllowed = false;
  const commandObj = REDIS_ALLOWED_COMMANDS.find(
    (c) => c.command === commandKeyword,
  );

  if (commandObj) {
    isAllowed = true;
  }

  return isAllowed;
}

function splitQuery(query: string) {
  /**
       inputQuery = "FT.SEARCH '{dbIndexName}' '@brandName:{nike} @gender:{men}'";
       output = ["FT.SEARCH", "{dbIndexName}", "@brandName:{nike} @gender:{men}"]
       */
  let retArr: string[] = [];

  //remove all empty lines and comments starting with # or //
  query = query
    .split('\n')
    .filter((line) => {
      const trimmedLine = line.trim();
      return (
        trimmedLine &&
        !(trimmedLine.startsWith('#') || trimmedLine.startsWith('//'))
      );
    })
    .join('\n');

  // replace all escape characters with placeholders
  query = query.replace(/\\"/g, 'ESCAPED_D_QUOTE');
  query = query.replace(/\\'/g, 'ESCAPED_S_QUOTE');
  query = query.replace(/\\t/g, 'ESCAPED_T');
  query = query.replace(/\\n/g, 'ESCAPED_N');
  query = query.replace(/\\r/g, 'ESCAPED_R');
  query = query.replace(/\\\\/g, 'ESCAPED_B');

  // Match either:
  // 1. A sequence of characters between quotes
  // 2. A sequence of non-space characters

  //const regex = /'[^']*'|\S+/g;
  const regex = /('[^']*'|"[^"]*"|\S+)/g;

  const matches = query.match(regex);

  if (matches) {
    retArr = matches.map((m) => {
      m = m.replace(/^['"]|['"]$/g, '');

      m = m.replace(/ESCAPED_D_QUOTE/g, '"');
      m = m.replace(/ESCAPED_S_QUOTE/g, "'");
      m = m.replace(/ESCAPED_T/g, '\t');
      m = m.replace(/ESCAPED_N/g, '\n');
      m = m.replace(/ESCAPED_R/g, '\r');
      m = m.replace(/ESCAPED_B/g, '\\');

      return m;
    });
  }

  // Convert binary strings back to proper format
  const processedArr: Array<string | Buffer> = retArr.map((part) => {
    if (part.includes('\\x')) {
      return Buffer.from(
        part.replace(/\\x([0-9a-fA-F]{2})/g, (_, hex) =>
          String.fromCharCode(parseInt(hex, 16)),
        ),
        'binary',
      );
    }
    return part;
  });

  return processedArr;
}

class RedisWrapper {
  client: RedisClientType | null = null;

  constructor(connectionURL?: string) {
    this.client = createClient({
      url: connectionURL,
      socket: {
        reconnectStrategy: (retries) => {
          if (retries > 3) {
            // Limit to 3 retry attempts
            return new Error('Retry attempts exhausted.');
          }
          // Retry after ms
          return 10;
        },
      },
    });
    this.client.on('error', (err) => {
      logError('Redis Client Error', err);
    });
  }

  async connect() {
    await this.client?.connect();
    logInfo('Connected successfully to Redis !');
  }

  async disconnect() {
    await this.client?.disconnect();
    logInfo('Disconnected from Redis.');
  }

  async set(key: string, value: string) {
    const result = await this.client?.set(key, value);
    return result;
  }

  async get(key: string) {
    const result = await this.client?.get(key);
    return result;
  }

  async getAllKeys(pattern?: string) {
    pattern = pattern || '*';
    const result = await this.client?.keys(pattern);
    return result;
  }

  async setExpiry(keys: string[], ttl: number) {
    if (keys && keys.length > 0) {
      await Promise.all(
        keys.map((key: string) => this.client?.expire(key, ttl)),
      );
    }
  }

  async getKeys(fetchLimit: number, pattern?: string) {
    let keys: string[] = [];

    if (fetchLimit > 0) {
      pattern = pattern || '*';
      let cursor = '0';
      let scanIterationCount = 100;
      if (scanIterationCount > fetchLimit) {
        scanIterationCount = fetchLimit;
      }

      do {
        const result = await this.client?.scan(cursor, {
          MATCH: pattern,
          COUNT: scanIterationCount,
        });

        if (result) {
          const { cursor: newCursor, keys: scanKeys } = result;
          cursor = newCursor;
          if (scanKeys?.length) {
            keys.push(...scanKeys);
          }

          if (keys.length >= fetchLimit) {
            break;
          } else if (fetchLimit - keys.length < scanIterationCount) {
            scanIterationCount = fetchLimit - keys.length;
          }
        } else {
          break;
        }
      } while (cursor !== '0');
    } else {
      throw new Error(
        'fetchLimit must be greater than 0 or use getAllKeys instead!',
      );
    }

    if (keys.length > fetchLimit) {
      keys = keys.slice(0, fetchLimit);
    }

    return keys;
  }

  async mGet(keys: string[]) {
    const result = await this.client?.mGet(keys);
    return result;
  }

  async jsonMGet(keys: string[]) {
    const result = await this.client?.json.mGet(keys, '.');
    return result;
  }

  async hashMGet(keys: string[]) {
    const result = await Promise.all(
      keys.map(async (key) => {
        const retObj: Record<string, unknown> =
          (await this.client?.hGetAll(key)) ?? {};
        retObj['id'] = key;
        return retObj;
      }),
    );
    return result;
  }

  async vsGetElmAttrs(key: string, elementIds: string[]) {
    const elements: unknown[] = [];
    if (key && elementIds?.length) {
      for (const elementId of elementIds) {
        let result = await this.rawCommandExecute(
          `VGETATTR "${key}" "${elementId}"`,
        );

        try {
          if (result && typeof result === 'string') {
            const parsed = JSON.parse(result) as Record<string, unknown>;
            parsed.elementId = elementId;
            elements.push(parsed);
            continue;
          }
        } catch (err) {
          // parse failure; push raw result
        }
        elements.push(result);
      }
    }
    return elements;
  }

  async vsGetRandomElementIds(key: string, count: number) {
    let result: unknown;
    if (key && count) {
      result = await this.rawCommandExecute(`VRANDMEMBER "${key}" ${count}`);
    }
    return result;
  }

  async vsGetRandomElements(key: string, count: number) {
    let elements: unknown[] = [];
    if (key && count) {
      const elementIds = await this.vsGetRandomElementIds(key, count);
      if (elementIds && Array.isArray(elementIds)) {
        elements = await this.vsGetElmAttrs(key, elementIds as string[]);
      }
    }
    return elements;
  }

  async rawCommandExecute(command: string, skipCmdCheck = false) {
    const commandArray = splitQuery(command);

    const firstArg = String(commandArray[0]);
    const cmd = firstArg.toUpperCase();
    const twoWordCmd =
      commandArray.length > 1
        ? `${firstArg.toUpperCase()} ${String(commandArray[1]).toUpperCase()}`
        : '';

    if (
      commandArray?.length &&
      !skipCmdCheck &&
      !isCommandAllowed(cmd) &&
      !isCommandAllowed(twoWordCmd)
    ) {
      throw new Error('Command not allowed');
    }
    const result = await this.client?.sendCommand(commandArray);
    return result;
  }

  async dropIndex(indexName: string) {
    let result: unknown;
    try {
      result = await this.client?.ft.dropIndex(indexName);
    } catch (err) {
      logError('Error in dropIndex', err);
    }
    return result;
  }
}

// Singleton class to wrap the Redis client
class RedisWrapperST extends RedisWrapper {
  private static instance: RedisWrapperST;

  private constructor(connectionURL?: string) {
    super(connectionURL);
  }

  static setInstance(connectionURL: string) {
    RedisWrapperST.instance = new RedisWrapperST(connectionURL);
    return RedisWrapperST.instance;
  }

  static getInstance(): RedisWrapperST {
    return RedisWrapperST.instance;
  }
}

export { RedisWrapper, RedisWrapperST, splitQuery };

/** Example Usage (RedisWrapper)
 
const redisWrapper = new RedisWrapper("redis://localhost:6379");
await redisWrapper.connect(); 
// perform redis operations
await redisWrapper.disconnect();
//--------------------------------

** Example Usage (RedisWrapperST)

// on app start
const redisWrapperST = RedisWrapperST.setInstance("redis://localhost:6379");
await redisWrapperST.connect(); 

// on app usage
const redisWrapperST = RedisWrapperST.getInstance();
await redisWrapperST.set("key", "value");
await redisWrapperST.client.set("key", "value"); // direct access to client 

*/
