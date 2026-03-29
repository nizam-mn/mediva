def normalize_metric_name(name: str):
    if not name:
        return None

    name = name.lower().strip()

    mapping = {
        "hemoglobin": "Hemoglobin",
        "blood sugar": "Blood Sugar",
        "glucose": "Blood Sugar",
        "blood pressure": "Blood Pressure",
        "cholesterol": "Total Cholesterol",
        "total cholesterol": "Total Cholesterol",
        "ldl": "LDL",
        "hdl": "HDL",
        "triglycerides": "Triglycerides",
        "heart rate": "Heart Rate",
        "spo2": "Oxygen (SpO₂)",
        "oxygen": "Oxygen (SpO₂)",
        "bmi": "BMI",
        "creatinine": "Creatinine",
        "hba1c": "HbA1c",
        "uric acid": "Uric Acid",
        "vitamin d": "Vitamin D",
        "vitamin b12": "Vitamin B12",
        "tsh": "TSH",
    }

    return mapping.get(name, name.title())


def parse_value(value):
    try:
        if isinstance(value, str):
            value = value.replace(",", "").strip()

        return float(value)
    except:
        return None


def extract_health_metrics(analysis_json):
    metrics = []

    tests = analysis_json.get("tests", [])

    for test in tests:
        name = normalize_metric_name(test.get("name"))
        raw_value = test.get("value")
        unit = test.get("unit")
        status = test.get("status", "unknown")

        if not name or raw_value is None:
            continue

        # Blood Pressure → keep string
        if name == "Blood Pressure":
            metrics.append({
                "name": name,
                "value": str(raw_value),
                "unit": unit or "mmHg",
                "status": status
            })
            continue

        value = parse_value(raw_value)

        if value is None:
            continue

        metrics.append({
            "name": name,
            "value": value,
            "unit": unit,
            "status": status
        })

    return metrics