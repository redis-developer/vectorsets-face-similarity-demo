interface RedisCommandPattern {
  command: string;
  category: string;
}

const HTTP_STATUS_CODES = {
  OK: 200,
  BAD_REQUEST: 400,
  NOT_FOUND: 404,
  METHOD_NOT_ALLOWED: 405,
  INTERNAL_SERVER_ERROR: 500,
};

const REDIS_WRITE_COMMANDS: RedisCommandPattern[] = [
  //Redis Vector Sets commands
  //{ command: "VADD", category: "vectorSets", canDbInsert: true },
  //{ command: "VREM", category: "vectorSets" },
  //{ command: "VSETATTR", category: "vectorSets" },
];

const REDIS_READ_COMMANDS: RedisCommandPattern[] = [
  //Redis Vector Sets commands
  { command: 'VCARD', category: 'vectorSets' },
  { command: 'VDIM', category: 'vectorSets' },
  { command: 'VEMB', category: 'vectorSets' },
  { command: 'VGETATTR', category: 'vectorSets' },
  { command: 'VINFO', category: 'vectorSets' },
  { command: 'VLINKS', category: 'vectorSets' },
  { command: 'VRANDMEMBER', category: 'vectorSets' },
  { command: 'VISMEMBER', category: 'vectorSets' },
  { command: 'VSIM', category: 'vectorSets' },
];

const REDIS_ALLOWED_COMMANDS = [
  ...REDIS_WRITE_COMMANDS,
  ...REDIS_READ_COMMANDS,
];

const GEMINI_MODEL = 'gemini-embedding-2-preview';
const GEMINI_EMBEDDING_DIMS = 3072;

const DEFAULT_BODY_LIMIT = '1mb';
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 100;
const DEFAULT_FRAME_ANCESTORS = 'https://redis.io,http://localhost:3000';

export {
  HTTP_STATUS_CODES,
  REDIS_ALLOWED_COMMANDS,
  GEMINI_MODEL,
  GEMINI_EMBEDDING_DIMS,
  DEFAULT_BODY_LIMIT,
  RATE_LIMIT_WINDOW_MS,
  RATE_LIMIT_MAX,
  DEFAULT_FRAME_ANCESTORS,
};
