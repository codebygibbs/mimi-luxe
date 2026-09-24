#os module lets us interact with things provided by the operating system.
import os 

from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

#any class that inherits from base can be treated as a sqlalchemy database model
Base = declarative_base()

#read the .env file & load its variables into the environment.
load_dotenv()

#find the environment variable and give me its value
DATABASE_URL = os.getenv("DATABASE_URL")

# mechanism sqlalchemy used to communicate with database.
engine = create_engine(DATABASE_URL)

# creates a session factory
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

def get_db():
    db = SessionLocal()
    try: 
        yield db
    finally:
        db.close()