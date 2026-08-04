# Farm Guard — Remote Poultry Health Monitoring System

## Problem
Algerian poultry farmers cannot monitor their farms remotely. Unstable electricity
causes fans to stop working. Combined with high temperature and high air pressure,
this leads to ascites (fluid swelling) in chickens, causing sickness or death.
Farmers only discover problems after the damage is done.

## Goal
Give farmers real-time visibility into farm conditions and instant alerts on their
phone when dangerous conditions are detected — even when away from the farm.

## MVP Features (Build First)
1. Sensor data ingestion (temperature, air pressure, electricity status)
2. FastAPI backend to receive and store sensor data
3. Rule-based anomaly detection (dangerous temp + pressure combo, power outage)
4. Telegram bot alerts sent instantly when anomaly detected
5. Simple web dashboard (mobile-friendly) showing live farm status

## Future Features (v2+)
- Multiple farms / multiple users
- Historical data + trend charts
- AI-based prediction (not just fixed rules)
- Native mobile app
- Auto-control (trigger backup generator)

## Tech Stack
- Backend: FastAPI (Python)
- Containerization: Docker
- CI/CD: GitHub Actions
- Infrastructure: Terraform
- Deployment: Render → later AWS (eu-west-3)
- Alerts: Telegram Bot API
- Orchestration (v2): Kubernetes

## Architecture (simple flow)
Sensor (simulated) → FastAPI → Anomaly Check → Telegram Alert
                              → Database → Dashboard
