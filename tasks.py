from celery import Celery
from celery_config import app


@app.task(bind=True)
def run_puppeteer_task(self, phone_number):
    import subprocess

    try:
        result = subprocess.check_output(
            ["node", "puppeteer.js", phone_number], stderr=subprocess.STDOUT
        )
        return result.decode("utf-8").strip()
    except subprocess.CalledProcessError as e:
        return f"Puppeteer script failed: {e.output.decode('utf-8')}"
