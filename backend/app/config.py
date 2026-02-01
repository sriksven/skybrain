from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    OPENAI_API_KEY: str = "your_openai_api_key_placeholder"
    ENV_NAME: str = "development"

    class Config:
        env_file = ".env"

settings = Settings()
