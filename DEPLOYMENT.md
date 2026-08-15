# PAP deployment on PythonAnywhere

The production app is loaded by PythonAnywhere through WSGI. Do not run Flask's development server publicly.

## Server directories

- SQLite database: `instance/pap.db`
- Product uploads: `uploads/products/`

Both directories live in the PythonAnywhere account filesystem. Runtime database and image files are intentionally excluded from Git.

## Required environment variables

- `PAP_ENV=production`
- `PAP_SECRET_KEY=<long random secret>`
- `PAP_ADMIN_PASSWORD=<strong admin password>`

Set these in the PythonAnywhere WSGI file before importing the application. Never add their real values to GitHub.

## WSGI example

Replace `YOUR_USERNAME` and the repository directory if needed:

```python
import os
import sys

project_path = "/home/YOUR_USERNAME/PAP_pussyandpuppy"
if project_path not in sys.path:
    sys.path.insert(0, project_path)

os.environ["PAP_ENV"] = "production"
os.environ["PAP_SECRET_KEY"] = "SET_A_LONG_RANDOM_VALUE_HERE"
os.environ["PAP_ADMIN_PASSWORD"] = "SET_A_STRONG_PASSWORD_HERE"

from app import app as application
```

The application creates the schema and seed products when the database does not exist.
