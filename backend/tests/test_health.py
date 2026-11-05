from app.db.session import get_db
from app.main import app
from fastapi.testclient import TestClient


class FakeDatabase:
    def execute(self, _: object) -> None:
        return None


def test_health_endpoint() -> None:
    app.dependency_overrides[get_db] = lambda: FakeDatabase()
    client = TestClient(app)
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok", "database": "ok"}
    app.dependency_overrides.clear()
