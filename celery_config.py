from celery import Celery

app = Celery(
    "tasks",
    broker="amqp://guest:guest@localhost:5672//",
    backend="redis://localhost:6379/0",
)
app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
)
