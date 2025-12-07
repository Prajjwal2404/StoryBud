from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os
import subprocess


def get_host_ip():
    try:
        result = subprocess.run("ip route show | grep default | awk '{print $3}'", shell=True, capture_output=True, text=True)
        ip = result.stdout.strip()
        if ip:
            return ip
            
    except:
        pass
    return '127.0.0.1'

host_ip = get_host_ip()
print(f"DEBUG: Connecting to MySQL Host at IP: {host_ip}")

SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL", f"mysql+pymysql://wsl:quantum@{host_ip}/storybud")

engine = create_engine(SQLALCHEMY_DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
