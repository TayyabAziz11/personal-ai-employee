#!/usr/bin/env python3
"""Wrapper: delegates to the Gold-tier Instagram watcher skill."""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "src"))

from personal_ai_employee.skills.gold.instagram_watcher_skill import main

if __name__ == "__main__":
    sys.exit(main())
