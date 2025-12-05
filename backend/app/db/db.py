from sqlmodel import SQLModel, create_engine, Session
import os
from app.db import models  # IMPORTANT


DATABASE_URL = "sqlite:///./digitwin.db"

engine = create_engine(
    DATABASE_URL, echo=True, connect_args={"check_same_thread": False}
)

def init_db():
    SQLModel.metadata.create_all(engine)

def get_session():
    with Session(engine) as session:
        yield session
