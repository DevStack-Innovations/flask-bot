from flask import Flask, render_template, request, jsonify
from wtforms import Form, StringField, validators
from tasks import run_puppeteer_task

app = Flask(__name__)


class PhoneForm(Form):
    phone = StringField(
        "Phone Number", [validators.Length(min=10, max=10), validators.DataRequired()]
    )


@app.route("/")
def index():
    form = PhoneForm(request.form)
    return render_template("index.html", form=form)


@app.route("/submit_form", methods=["POST"])
def submit_form():
    form = PhoneForm(request.form)
    if form.validate():
        phone_number = form.phone.data
        try:
            task = run_puppeteer_task.delay(phone_number)
            return jsonify({"task_id": task.id})
        except Exception as e:
            return jsonify({"error": f"Failed to queue task: {str(e)}"}), 500
    return jsonify({"error": "Invalid phone number"}), 400


@app.route("/check_task/<task_id>")
def check_task(task_id):
    task = run_puppeteer_task.AsyncResult(task_id)
    if task.state == "PENDING":
        return jsonify({"status": "PENDING"})
    elif task.state == "SUCCESS":
        return jsonify({"status": "SUCCESS", "result": task.result})
    else:
        return jsonify({"status": "FAILURE", "result": str(task.result)})


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
