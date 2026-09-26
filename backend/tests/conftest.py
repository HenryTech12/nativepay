import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.models import AgentBmoniProfile
from app.services import sessions, store


@pytest.fixture(autouse=True)
def _isolate_agent_bmoni_profile():
    """The agent's BMONI profile (store.agent_bmoni_profile) is a single
    module-level global, shared platform-wide by design (see
    AgentBmoniProfile's docstring) — but that makes it leak across
    unrelated tests unless we reset it each time. Some tests assert it's
    NOT onboarded (mock-transfer path); others onboard it deliberately."""
    store.agent_bmoni_profile = AgentBmoniProfile()
    yield
    store.agent_bmoni_profile = AgentBmoniProfile()


@pytest.fixture
def client():
    with TestClient(app) as c:
        yield c
    sessions.clear_all()


def make_face_descriptor(seed: float = 0.1) -> list[float]:
    """A deterministic, valid-shape (128-float) fake face descriptor."""
    return [seed] * 128


def make_voiceprint(seed: float = 0.2) -> list[float]:
    return [seed] * 32
