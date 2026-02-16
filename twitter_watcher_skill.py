#!/usr/bin/env python3
"""Backwards compatibility wrapper for twitter_watcher_skill.py"""
import sys
from pathlib import Path
repo_root = Path(__file__).parent
sys.path.insert(0, str(repo_root / 'src'))
from personal_ai_employee.skills.gold.twitter_watcher_skill import main
if __name__ == '__main__':
    main()
