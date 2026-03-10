# ML Service Deployment

This folder is a standalone Flask service for the forecasting model.

Deployable files included:

- `app.py`
- `wsgi.py`
- `requirements.txt`
- `Procfile`
- `runtime.txt`

Environment variables:

- `PORT`
- `ML_DATA_PATH`

Recommended production start command:

```bash
gunicorn --bind 0.0.0.0:$PORT wsgi:application
```

Local run:

```bash
pip install -r requirements.txt
python app.py
```
