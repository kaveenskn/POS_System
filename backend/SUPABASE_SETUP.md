# Connecting the POS System to Supabase

The backend uses **SQLAlchemy 2.0** with **psycopg 3**, which natively connects to **Supabase PostgreSQL**.

---

## 1. Retrieve your Supabase Connection String

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard).
2. Open your Project -> Click the **Project Settings** gear icon (bottom left).
3. Under **Configuration**, click **Database**.
4. Scroll down to **Connection string**:
   - Select the **URI** tab.
   - Choose **Transaction Pooler** (recommended for production/serverless, port `6543`) or **Direct Connection** (port `5432`).
   - Copy the URI, for example:
     ```
     postgresql://postgres.[YOUR-PROJECT-REF]:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres
     ```

---

## 2. Configure Environment Variables

In your `backend/.env` file, set `DATABASE_URL` with your copied URI:

```ini
# Supabase PostgreSQL Database URI
DATABASE_URL=postgresql+psycopg://postgres.[YOUR-PROJECT-REF]:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?sslmode=require

# (Optional) Supabase API credentials
SUPABASE_URL=https://[YOUR-PROJECT-REF].supabase.co
SUPABASE_KEY=[YOUR-SUPABASE-ANON-KEY]
SUPABASE_SERVICE_ROLE_KEY=[YOUR-SUPABASE-SERVICE-ROLE-KEY]

# Backend CORS (allows frontend requests)
BACKEND_CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
```

> **Note**: If your copied string starts with `postgresql://` or `postgres://`, the backend automatically handles and formats it for `psycopg 3` (`postgresql+psycopg://`).

---

## 3. Database Initialization Options

### Option A: Automatic Initialization (Recommended)
When you run the backend:
```bash
uvicorn app.main:app --reload --port 8000
```
The FastAPI application's startup lifecycle automatically runs `init_database()`, which creates all 5 tables (`categories`, `brands`, `products`, `stock_movements`, `product_activities`) and seeds standard categories and brands if empty.

### Option B: Execute via Supabase SQL Editor
If you prefer creating the tables and running the schema manually in Supabase:
1. Open Supabase Dashboard -> **SQL Editor**.
2. Click **New Query**.
3. Copy and paste the contents of `backend/supabase_schema.sql`.
4. Click **Run**.

