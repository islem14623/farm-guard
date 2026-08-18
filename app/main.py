from fastapi import FastAPI, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session 
from app.auth import hash_password, verify_password, create_access_token, get_current_user
import random
from app.database import init_db, get_db
from app import models
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from app.sms import send_sms_alert

load_dotenv()


app = FastAPI()



app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:8080", "http://127.0.0.1:8080", "https://farm-guard-frontend.onrender.com"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def startup():
    init_db()


class SensorData(BaseModel):
    temperature: float
    humidity: float
    electricity_on: bool
    chicken_age_days: int 

class UserSignup(BaseModel):
    name: str
    phone: str
    password: str


class UserLogin(BaseModel):
    phone: str
    password: str


def get_ideal_temp_range(age_days: int):
    """Returns (min_temp, max_temp) in Celsius based on chicken age."""
    if age_days <= 7:
        return (32, 35)
    elif age_days <= 14:
        return (29, 32)
    elif age_days <= 21:
        return (26, 29)
    elif age_days <= 28:
        return (23, 26)
    elif age_days <= 35:
        return (20, 23)
    else:
        return (18, 21)


def check_anomaly(data: SensorData):
    alerts = []
    min_temp, max_temp = get_ideal_temp_range(data.chicken_age_days)

    buffer = 2 if data.chicken_age_days <= 7 else 5

    # Temperature checks
    if data.temperature > max_temp + buffer:
        alerts.append("⚠️ تنبيه: الحرارة مرتفعة جداً")
    elif data.temperature < min_temp - buffer:
        alerts.append("⚠️ تنبيه: الحرارة منخفضة جداً")

    # Humidity check
    if data.humidity > 70:
        alerts.append("⚠️ تنبيه: الرطوبة مرتفعة، خطر على الفرشة والأمراض")

    # Electricity check (always alert if off)
    if not data.electricity_on:
        alerts.append("⚠️ تحذير: انقطاع الكهرباء! المروحة متوقفة")

    return alerts


def save_reading(data: SensorData, db: Session, user_id: int = None):
    """Saves a sensor reading to the database and returns the saved row."""
    new_reading = models.SensorReading(
        temperature=data.temperature,
        humidity=data.humidity,
        electricity_on=data.electricity_on,
        chicken_age_days=data.chicken_age_days,
        user_id=user_id,
    )
    db.add(new_reading)
    db.commit()
    db.refresh(new_reading)
    return new_reading


@app.get("/")
def read_root():
    return {"message": "Farm Guard API is running"}




@app.post("/sensor-data")
def receive_sensor_data(
    data: SensorData,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    alerts = check_anomaly(data)
    new_reading = save_reading(data, db, user_id=current_user.id)

    if alerts:
        message = "\n".join(alerts)
        try:
            send_sms_alert(current_user.phone, message)
        except Exception as e:
            print(f"Failed to send SMS alert: {e}")  
            
    return {"status": "saved", "id": new_reading.id, "alerts": alerts}           

@app.get("/fake-sensor")
def generate_fake_data(db: Session = Depends(get_db)):
    data = SensorData(
        temperature=round(random.uniform(15, 40), 1),
        humidity=round(random.uniform(40, 85), 1),
        electricity_on=random.choice([True, False]),
        chicken_age_days=random.randint(1, 45),
    )
    alerts = check_anomaly(data)
    new_reading = save_reading(data, db)
    return {"data": data, "alerts": alerts, "id": new_reading.id}


@app.get("/test-sensor")
def test_sensor(
    temperature: float,
    humidity: float,
    electricity_on: bool,
    chicken_age_days: int,
    db: Session = Depends(get_db),
):
    data = SensorData(
        temperature=temperature,
        humidity=humidity,
        electricity_on=electricity_on,
        chicken_age_days=chicken_age_days,
    )
    alerts = check_anomaly(data)
    new_reading = save_reading(data, db)
    return {"data": data, "alerts": alerts, "id": new_reading.id}

@app.post("/signup")
def signup(user: UserSignup, db: Session = Depends(get_db)):
    existing_user = db.query(models.User).filter(models.User.phone == user.phone).first()
    if existing_user:
        return {"error": "Phone number already registered"}

    hashed_pw = hash_password(user.password)
    new_user = models.User(name=user.name, phone=user.phone, password=hashed_pw)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return {"status": "account created", "user_id": new_user.id}

@app.post("/login")
def login(user: UserLogin, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.phone == user.phone).first()

    if not db_user:
        return {"error": "Invalid phone or password"}

    if not verify_password(user.password, db_user.password):
        return {"error": "Invalid phone or password"}

    token = create_access_token({"user_id": db_user.id})

    return {"access_token": token, "token_type": "bearer"}
@app.get("/my-readings")
def get_my_readings(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    readings = db.query(models.SensorReading).filter(
        models.SensorReading.user_id == current_user.id
    ).all()
    return readings