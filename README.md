# Farm Guard

A backend API that monitors poultry farms in Algeria. It reads sensor data (temperature, humidity, electricity), detects problems, and uses an AI agent to explain each alert in simple Arabic for farmers.

## The problem

Poultry farmers can lose a whole flock if the temperature is wrong or the power goes off for a few hours. Chicks need different temperatures at different ages. Most farms have no automatic warning.

## What it does

- Receives sensor readings: temperature, humidity, electricity status, and chicken age
- Checks them against the ideal temperature range for the chicken's age
- Creates alerts: temperature too high or low, humidity above 70%, power outage
- An **AI agent** (Groq LLM) explains each alert in 2-3 simple Arabic sentences and says what the farmer should do
- Saves every reading in PostgreSQL and a JSON backup in S3
- User accounts with JWT login, and each user sees only their own readings
- Exposes metrics for Prometheus and Grafana

## Tech stack

| Area | Tools |
|---|---|
| Backend | Python, FastAPI, SQLAlchemy, Pydantic |
| Database | PostgreSQL |
| Auth | JWT, hashed passwords |
| AI | Groq API (`openai/gpt-oss-20b`) |
| Storage | S3 with boto3 (tested locally with the Floci AWS emulator) |
| Testing | Pytest |
| DevOps | Docker (multi-stage), Docker Compose, GitHub Actions, Kubernetes (minikube), Helm |
| Monitoring | Prometheus, Grafana |

## API endpoints

| Method | Endpoint | Description |
|---|---|---|
| POST | `/signup` | Create an account |
| POST | `/login` | Get a JWT token |
| POST | `/sensor-data` | Send a reading (needs login) |
| GET | `/my-readings` | List your readings (needs login) |
| GET | `/fake-sensor` | Generate a random test reading |
| GET | `/test-sensor` | Send a reading with query parameters |
| GET | `/metrics` | Prometheus metrics |

Example response when something is wrong:

```json
{
  "alerts": ["⚠️ تنبيه: الحرارة مرتفعة جداً"],
  "explanation": "..."
}
```

## How it works

```
Sensor / ESP32  →  FastAPI  →  check_anomaly()  →  alerts
                      │                               │
                      ├─→ PostgreSQL                  └─→ Groq AI → explanation
                      └─→ S3 (JSON backup)
```

## Run it locally

1. Clone and create a virtual environment:

```bash
git clone https://github.com/islem14623/farm-guard.git
cd farm-guard
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

2. Create a `.env` file:

```
DATABASE_URL=postgresql://USER:PASSWORD@localhost:5433/DBNAME
GROQ_API_KEY=your_key_here
SECRET_KEY=your_secret_here
```

3. Start the database:

```bash
docker compose up -d db
```

4. (Optional) Start the local AWS emulator and create the bucket:

```bash
floci start
aws s3 mb s3://my-bucket
```

5. Run the API:

```bash
uvicorn app.main:app --reload
```

Open http://localhost:8000/docs to try the API.

## Run the tests

```bash
pytest
```

## What I learned

- Building a REST API with authentication and a database
- Using an LLM with a system prompt to turn raw alerts into advice that farmers can understand
- Storing data in S3 with boto3 and testing against a local emulator, because I had no cloud account
- Packaging with Docker and deploying with Kubernetes and Helm
- Debugging real problems: port mismatches, missing environment variables, a full disk

## Current limitations

- SMS alerts need Twilio, which does not work in Algeria. The code exists but is not active.
- The ESP32 sensor simulation is not connected yet. Readings come from the fake-sensor endpoint.
- AWS parts were tested on a local emulator, not on real AWS.

## Next steps

- [ ] Connect a real or simulated ESP32 sensor
- [ ] Add anomaly detection with a model trained on sensor data
- [ ] Add alerts through Telegram or another working channel
- [ ] Add Terraform for the infrastructure

## Author

Islem Chenafi, Junior DevOps / Cloud Engineer
GitHub: [islem14623](https://github.com/islem14623)
