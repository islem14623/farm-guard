import os
from groq import Groq

client = Groq(api_key=os.getenv("GROQ_API_KEY"))

SYSTEM_PROMPT = """You are an assistant helping poultry farmers in Algeria 
understand problems with their flock's environment. You will be given sensor 
readings and a list of detected alerts. Explain in simple terms (2-3 sentences, 
in Arabic) what is likely causing the issue and what the farmer should do right 
now. Be practical and direct."""


def explain_alert(data, alerts):
    user_message = f"""
    Sensor reading: temperature={data.temperature}°C, humidity={data.humidity}%, 
    electricity_on={data.electricity_on}, chicken_age_days={data.chicken_age_days}

    Detected alerts: {"; ".join(alerts)}
    """

    response = client.chat.completions.create(
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": user_message}
        ],
        model="openai/gpt-oss-20b"
    )
    return response.choices[0].message.content