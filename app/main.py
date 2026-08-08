from fastapi import FastAPI, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session
import random
from app.database import init_db, get_db
from app import models

app = FastAPI()


@app.on_event("startup")
def startup():
    init_db()


class SensorData(BaseModel):
    temperature: float
    humidity: float
    electricity_on: bool
    chicken_age_days: int


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


def save_reading(data: SensorData, db: Session):
    """Saves a sensor reading to the database and returns the saved row."""
    new_reading = models.SensorReading(
        temperature=data.temperature,
        humidity=data.humidity,
        electricity_on=data.electricity_on,
        chicken_age_days=data.chicken_age_days,
    )
    db.add(new_reading)
    db.commit()
    db.refresh(new_reading)
    return new_reading


@app.get("/")
def read_root():
    return {"message": "Farm Guard API is running"}


@app.post("/sensor-data")
def receive_sensor_data(data: SensorData, db: Session = Depends(get_db)):
    alerts = check_anomaly(data)
    new_reading = save_reading(data, db)
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