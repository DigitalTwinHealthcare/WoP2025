import uuid
import re
from datetime import datetime
from pathlib import Path

import pandas as pd

BASE_DIR = Path(__file__).resolve().parents[1]  # EHR/ root

# LOAD INDIAN DRUG MAPPING — BULLETPROOF
try:
    drug_map = pd.read_csv(BASE_DIR / "data" / "mappings" / "indian_drugs.csv", dtype=str)
    # Normalize brand names: lowercase + strip spaces
    DRUG_MAPPING = {}
    for brand, generic in zip(drug_map["brand"].str.strip(), drug_map["generic"].str.strip()):
        key = brand.lower()
        DRUG_MAPPING[key] = generic
        # Also add partial matches (e.g., "met xl" works even if user writes "met xl 50 od")
        short_key = " ".join(key.split()[:2])  # first two words
        if short_key not in DRUG_MAPPING:
            DRUG_MAPPING[short_key] = generic
    print(f"Loaded {len(DRUG_MAPPING)} Indian drug mappings → READY")
except Exception as e:
    print("indian_drugs.csv not found or failed → using raw names")
    DRUG_MAPPING = {}

def clean_number(value):
    if not value or str(value).strip() == "" or str(value).lower() in ["na", "n/a", "none"]:
        return None
    numbers = re.findall(r'\d+', str(value))
    return int(numbers[0]) if numbers else None

def first_valid_number(candidates):
    for val in candidates:
        cleaned = clean_number(val)
        if cleaned is not None:
            return cleaned
    return None

def parse_boolean(value):
    """
    Interpret varied clinical inputs (Yes/No, 1/0, True/False) into a bool.
    Returns None when the column is empty or ambiguous to avoid fabricating diagnoses.
    """
    if value is None:
        return None
    text = str(value).strip().lower()
    if not text:
        return None
    positives = {"yes", "y", "true", "1", "present", "positive", "mi", "detected"}
    negatives = {"no", "n", "false", "0", "absent", "negative", "none"}
    if text in positives:
        return True
    if text in negatives:
        return False
    return None

def super_clean_text(text: str):
    if not text:
        return ""

    # Normalize weird quotes
    text = (
        text.replace("“", '"')
            .replace("”", '"')
            .replace("‘", "'")
            .replace("’", "'")
    )

    # Remove unicode garbage
    text = text.encode("ascii", "ignore").decode()

    # Replace various separators by comma
    text = re.sub(r'[\+;/]', ',', text)

    # Remove extra spaces around commas
    text = re.sub(r'\s*,\s*', ',', text)

    # Collapse multiple commas to one
    text = re.sub(r',+', ',', text)

    return text.strip(" ,")


def normalize_row(row):
    name = str(row.get("Name") or row.get("name") or "Unknown").strip()
    
    # Age - try direct age first, then calculate from birth_date
    age_raw = row.get("Age") or row.get("age") or row.get("AGE")
    age = clean_number(age_raw)
    
    # If no age, try to calculate from birth_date
    if age is None or age < 1 or age > 120:
        birth_date_raw = row.get("birth_date") or row.get("Birth Date") or row.get("birthDate") or row.get("BirthDate")
        if birth_date_raw:
            try:
                # Try parsing YYYY-MM-DD format
                birth_date = datetime.strptime(str(birth_date_raw).strip(), "%Y-%m-%d")
                age = datetime.now().year - birth_date.year
                # Adjust if birthday hasn't occurred this year
                if datetime.now().month < birth_date.month or (datetime.now().month == birth_date.month and datetime.now().day < birth_date.day):
                    age -= 1
            except (ValueError, TypeError):
                # Try just year
                year_match = re.search(r'(\d{4})', str(birth_date_raw))
                if year_match:
                    birth_year = int(year_match.group(1))
                    age = datetime.now().year - birth_year
                    if age < 1 or age > 120:
                        age = None
    
    # Final fallback
    if age is None or age < 1 or age > 120:
        age = 50
    
    gender_raw = str(row.get("Gender") or row.get("gender") or row.get("Sex") or "unknown").strip().upper()

    # Gender
    gender = "U"
    if gender_raw and (gender_raw.startswith("F") or gender_raw == "FEMALE" or gender_raw == "2"):
        gender = "F"
    elif gender_raw and (gender_raw.startswith("M") or gender_raw == "MALE" or gender_raw == "1"):
        gender = "M"

    # BP - support both space-separated and snake_case column names
    systolic_candidates = [
        row.get("Systolic BP"),
        row.get("Systolic"),
        row.get("SBP"),
        row.get("SystolicBP"),
        row.get("systolic_bp")
    ]
    diastolic_candidates = [
        row.get("Diastolic BP"),
        row.get("Diastolic"),
        row.get("DBP"),
        row.get("DiastolicBP"),
        row.get("diastolic_bp")
    ]

    bp_systolic = first_valid_number(systolic_candidates)
    bp_diastolic = first_valid_number(diastolic_candidates)

    if bp_systolic is None or bp_diastolic is None:
        bp_raw = str(row.get("BP") or row.get("bp") or row.get("Blood Pressure") or "")
        bp_match = re.search(r'(\d+)[\/\-]\s*(\d+)', bp_raw)
        if bp_systolic is None:
            bp_systolic = int(bp_match.group(1)) if bp_match else None
        if bp_diastolic is None:
            bp_diastolic = int(bp_match.group(2)) if bp_match else None

    # Heart Rate
    hr_raw = row.get("HR") or row.get("hr") or row.get("Heart Rate") or row.get("heart_rate") or ""
    heart_rate = clean_number(hr_raw)

    # Weight (kg)
    weight_raw = (
        row.get("Weight")
        or row.get("weight")
        or row.get("Wt")
        or row.get("wt")
        or row.get("WEIGHT")
        or ""
    )
    weight_kg = clean_number(weight_raw)

    # Height (cm)
    height_raw = (
        row.get("Height")
        or row.get("height")
        or row.get("Ht")
        or row.get("ht")
        or row.get("HEIGHT")
        or ""
    )
    height_cm = clean_number(height_raw)

    # MEDICATIONS — INDIAN BRAND → GENERIC (THE MAGIC)
    meds_raw = super_clean_text(
        str(row.get("Medications") or row.get("medications") or row.get("Drugs") or "")
    )
    # Support both comma and semicolon
    meds_list = [m.strip() for m in re.split(r'[;,]', meds_raw) if m.strip()]
    standardized_meds = []

    for med in meds_list:
        med_clean = med.strip().lower()
        # Try exact match
        generic = DRUG_MAPPING.get(med_clean)
        # Try partial match (e.g., "met xl 50 od" → contains "met xl")
        if not generic:
            for key in DRUG_MAPPING:
                if key in med_clean:
                    generic = DRUG_MAPPING[key]
                    break
        standardized_meds.append(generic or med)  # fallback to original if not found

    meds_standardized_text = ", ".join(standardized_meds)
    if not meds_standardized_text and meds_raw:
        meds_standardized_text = meds_raw  # preserve original text if mapping fails entirely

    # Use existing patient_id if present, otherwise generate one
    patient_id = (
        row.get("patient_id") 
        or row.get("Patient ID") 
        or row.get("PatientID")
        or f"PT{abs(hash(name + str(age) + gender)) % 100000:05d}"
    )

    mi_status = (
        row.get("Myocardial Infarction (MI)")
        or row.get("MI")
        or row.get("mi")
        or row.get("myocardial_infarction")
        or row.get("myocardial infarction")
    )


    return {
        "patient_id": patient_id,
        #"name": name,
        "age": age,
        "gender": gender,
        "weight_kg": weight_kg,
        "height_cm": height_cm,
        "bp_systolic": bp_systolic,
        "bp_diastolic": bp_diastolic,
        "heart_rate": heart_rate,
        "medications_raw": meds_raw,
        "medications_standardized": meds_standardized_text,
        "myocardial_infarction": parse_boolean(mi_status),
        "source_file": row.get("_source_file", "unknown")
    }