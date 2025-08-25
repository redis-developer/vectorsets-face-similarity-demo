interface IRedisCommandPattern {
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

const REDIS_WRITE_COMMANDS: IRedisCommandPattern[] = [
  //Redis Vector Sets commands
  //{ command: "VADD", category: "vectorSets", canDbInsert: true },
  //{ command: "VREM", category: "vectorSets" },
  //{ command: "VSETATTR", category: "vectorSets" },
];

const REDIS_READ_COMMANDS: IRedisCommandPattern[] = [
  //Redis Vector Sets commands
  { command: "VCARD", category: "vectorSets" },
  { command: "VDIM", category: "vectorSets" },
  { command: "VEMB", category: "vectorSets" },
  { command: "VGETATTR", category: "vectorSets" },
  { command: "VINFO", category: "vectorSets" },
  { command: "VLINKS", category: "vectorSets" },
  { command: "VRANDMEMBER", category: "vectorSets" },
  { command: "VISMEMBER", category: "vectorSets" },
  { command: "VSIM", category: "vectorSets" },
];

const REDIS_ALLOWED_COMMANDS = [
  ...REDIS_WRITE_COMMANDS,
  ...REDIS_READ_COMMANDS,
];

export { HTTP_STATUS_CODES, REDIS_ALLOWED_COMMANDS };
