# ANIMA Agent Runtime - Directory Structure

**Updated**: 2026-05-29 (after directory reorganization)

---

## 📂 Project Structure

```
agent-runtime/
│
├── src/                           # Source code package
│   ├── __init__.py               # Package marker
│   ├── monitor.py                # Price monitoring module
│   └── walrus_client.py          # Walrus storage client
│
├── tests/                        # Test suite
│   ├── __init__.py               # Package marker
│   └── test_phase1.py            # Comprehensive tests
│
├── config/                       # Configuration files
│   └── skill_schema.json         # Skill configuration template
│
├── models/                       # ML model weights (Phase 2+)
│   └── (empty - for trained models)
│
├── main.py                       # Entry point
├── requirements.txt              # Python dependencies
├── .env.template                 # Environment template
│
├── validate_phase1.py            # Setup validation script
├── setup_phase1.py               # Setup automation
│
└── docs/                         # Documentation
    ├── INDEX.md
    ├── QUICK_REFERENCE.md
    ├── README_PHASE1.md
    ├── PHASE1_EXECUTION_REPORT.md
    └── ... (other docs)
```

---

## 🔄 Import Changes

**Before** (files in root):
```python
from monitor import PriceMonitor
from walrus_client import WalrusClient
```

**After** (files in src/):
```python
from src.monitor import PriceMonitor
from src.walrus_client import WalrusClient
```

---

## 📦 Module Organization

### src/monitor.py
- `PriceMonitor` class - Price fetching and polling
- `PriceData` dataclass - Price information container

### src/walrus_client.py
- `WalrusClient` class - Skill storage client
- `SkillConfig` dataclass - Skill configuration
- `WalrusRoundTripTest` class - Validation harness

### tests/test_phase1.py
- `TestPriceData` - PriceData tests
- `TestPriceMonitor` - PriceMonitor tests
- `TestSkillConfig` - SkillConfig tests
- `TestWalrusClient` - WalrusClient tests
- `TestIntegration` - Integration tests

### config/skill_schema.json
- JSON template for skill configuration
- Used by WalrusClient

---

## 🚀 Running Tests with New Structure

```bash
# From agent-runtime directory
pytest tests/test_phase1.py -v

# Or with full path
python -m pytest tests/test_phase1.py -v
```

---

## ✅ Migration Checklist

- [x] Create src/ directory with modules
- [x] Create tests/ directory with test file
- [x] Create config/ directory with skill schema
- [x] Update imports in main.py
- [x] Update imports in validate_phase1.py
- [x] Update imports in test files
- [x] Create __init__.py files for packages
- [x] Move skill_schema.json to config/
- [x] Move monitor.py to src/
- [x] Verify all imports work

---

## 📝 Files Moved

| Original Location | New Location | Status |
|---|---|---|
| monitor.py | src/monitor.py | ✅ Moved |
| walrus_client.py | src/walrus_client.py | ✅ Already there |
| skill_schema.json | config/skill_schema.json | ✅ Copied |
| test_phase1.py | tests/test_phase1.py | ✅ Created |

---

## 🔧 Updated Files

| File | Changes | Status |
|---|---|---|
| main.py | Updated imports to use src/ | ✅ Done |
| validate_phase1.py | Updated imports to use src/ | ✅ Done |
| tests/test_phase1.py | Updated imports to use src/ | ✅ Done |

---

## 🎯 Next Steps

1. Test the new structure:
   ```bash
   python main.py                    # Should work with new imports
   pytest tests/test_phase1.py -v    # Should pass all tests
   python validate_phase1.py         # Should pass validation
   ```

2. Phase 2 will follow the same structure:
   ```
   src/
   ├── monitor.py
   ├── walrus_client.py
   ├── predictor.py          # NEW in Phase 2
   └── orchestrator.py       # NEW in Phase 2
   ```

---

**Status**: ✅ Directory reorganization complete
