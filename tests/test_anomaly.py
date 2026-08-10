from app.main import SensorData, check_anomaly


def test_cold_young_chick():
    """A 2-day chick needs 32-35C. 25C is far too cold -> should alert."""
    data = SensorData(
        temperature=25,
        humidity=50,
        electricity_on=True,
        chicken_age_days=2,
    )
    alerts = check_anomaly(data)
    assert any("منخفضة" in a for a in alerts)


def test_normal_young_chick():
    """A 2-day chick at 33C is inside the ideal range -> no temperature alert."""
    data = SensorData(
        temperature=33,
        humidity=50,
        electricity_on=True,
        chicken_age_days=2,
    )
    alerts = check_anomaly(data)
    assert not any("الحرارة" in a for a in alerts)


def test_high_humidity():
    """Humidity above 70 should always trigger a humidity alert."""
    data = SensorData(
        temperature=25,
        humidity=75,
        electricity_on=True,
        chicken_age_days=20,
    )
    alerts = check_anomaly(data)
    assert any("الرطوبة" in a for a in alerts)


def test_electricity_off_always_alerts():
    """Electricity off should alert even if temperature is fine."""
    data = SensorData(
        temperature=25,
        humidity=50,
        electricity_on=False,
        chicken_age_days=20,
    )
    alerts = check_anomaly(data)
    assert any("الكهرباء" in a for a in alerts)