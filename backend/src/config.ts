import "dotenv/config";

const getConfig = () => {
  return {
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    OPENAI_MODEL_NAME: process.env.OPENAI_MODEL_NAME || "gpt-4o", //"gpt-4o-mini"
    REDIS_URL: process.env.REDIS_URL || "redis://localhost:6379",

    // process.env.PORT can be dynamic vendor port
    PORT: process.env.PORT || "3001",
    ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS, //comma separated list of allowed origins
    EMBED_PYTHON_URL:
      process.env.EMBED_PYTHON_URL || "http://localhost:8009/embed",
    UPLOAD_DIR: process.env.UPLOAD_DIR || "uploads",
    UPLOAD_MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB

    REDIS_KEYS: {
      VSET_CELEB: {
        NAME: "vset:celeb",
        DIM: 768,
      },
    },
  };
};

export { getConfig };
