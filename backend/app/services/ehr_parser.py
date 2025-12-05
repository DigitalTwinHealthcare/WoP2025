from __future__ import annotations

import json
import re
import xml.etree.ElementTree as ET
from io import BytesIO
from typing import Any, Dict

import pandas as pd
from fastapi import HTTPException

from app.utils.logger import get_logger

logger = get_logger(__name__)


def clean_number(value: Any) -> int | None:
    """Extract first valid number from a value."""
    if not value or str(value).strip() == "" or str(value).lower() in ["na", "n/a", "none"]:
        return None
    numbers = re.findall(r"\d+", str(value))
    return int(numbers[0]) if numbers else None


def parse_csv(content: bytes) -> Dict[str, Any]:
    """
    Parse CSV EHR file and return normalized data.
    
    Expected CSV format:
    name,age,gender,height_cm,weight_kg,blood_pressure_sys,blood_pressure_dia,heart_rate,condition,medications
    """
    try:
        df = pd.read_csv(BytesIO(content), dtype=str, na_filter=False)
        
        if df.empty:
            raise HTTPException(status_code=400, detail="CSV file is empty")
        
        # Take first row (assuming single patient per file)
        row = df.iloc[0].to_dict()
        
        # Normalize column names (case-insensitive, handle variations)
        normalized = {}
        for key, value in row.items():
            key_lower = key.lower().strip()
            # Map common variations
            if "name" in key_lower:
                normalized["name"] = str(value).strip()
            elif "age" in key_lower:
                normalized["age"] = clean_number(value)
            elif "gender" in key_lower or "sex" in key_lower:
                gender_str = str(value).strip().lower()
                if gender_str.startswith("m") or gender_str == "1":
                    normalized["gender"] = "male"
                elif gender_str.startswith("f") or gender_str == "2":
                    normalized["gender"] = "female"
                else:
                    normalized["gender"] = "unknown"
            elif "height" in key_lower:
                normalized["height_cm"] = clean_number(value)
            elif "weight" in key_lower:
                normalized["weight_kg"] = clean_number(value)
            elif "systolic" in key_lower or "sys" in key_lower:
                normalized["blood_pressure_sys"] = clean_number(value)
            elif "diastolic" in key_lower or "dia" in key_lower:
                normalized["blood_pressure_dia"] = clean_number(value)
            elif "heart" in key_lower and "rate" in key_lower:
                normalized["heart_rate"] = clean_number(value)
            elif "condition" in key_lower:
                normalized["condition"] = str(value).strip()
            elif "medication" in key_lower or "drug" in key_lower:
                meds_str = str(value).strip()
                # Handle comma/semicolon separated medications
                if meds_str:
                    meds_list = [m.strip() for m in re.split(r"[;,]", meds_str) if m.strip()]
                    normalized["medications"] = meds_list
                else:
                    normalized["medications"] = []
        
        return normalize_data(normalized)
        
    except pd.errors.EmptyDataError:
        raise HTTPException(status_code=400, detail="CSV file is empty or invalid")
    except Exception as e:
        logger.error("Error parsing CSV: %s", e)
        raise HTTPException(status_code=400, detail=f"Failed to parse CSV: {str(e)}")


def parse_json(content: bytes) -> Dict[str, Any]:
    """
    Parse JSON EHR file and return normalized data.
    
    Expected JSON format:
    {
      "name": "John Doe",
      "age": 45,
      "gender": "male",
      "height_cm": 178,
      "weight_kg": 82,
      "blood_pressure": { "systolic": 150, "diastolic": 95 },
      "heart_rate": 95,
      "condition": "Hypertension",
      "medications": ["Atenolol 50mg"]
    }
    """
    try:
        data = json.loads(content.decode("utf-8"))
        
        # Handle nested blood_pressure object
        if "blood_pressure" in data and isinstance(data["blood_pressure"], dict):
            bp = data["blood_pressure"]
            data["blood_pressure_sys"] = bp.get("systolic")
            data["blood_pressure_dia"] = bp.get("diastolic")
            del data["blood_pressure"]
        
        # Ensure medications is a list
        if "medications" in data:
            if isinstance(data["medications"], str):
                # Split comma/semicolon separated string
                data["medications"] = [m.strip() for m in re.split(r"[;,]", data["medications"]) if m.strip()]
            elif not isinstance(data["medications"], list):
                data["medications"] = []
        else:
            data["medications"] = []
        
        return normalize_data(data)
        
    except json.JSONDecodeError as e:
        logger.error("Error parsing JSON: %s", e)
        raise HTTPException(status_code=400, detail=f"Invalid JSON format: {str(e)}")
    except Exception as e:
        logger.error("Error processing JSON: %s", e)
        raise HTTPException(status_code=400, detail=f"Failed to process JSON: {str(e)}")


def parse_xml(content: bytes) -> Dict[str, Any]:
    """
    Parse XML EHR file and return normalized data.
    
    Expected XML format:
    <patient>
        <name>John Doe</name>
        <age>45</age>
        <gender>male</gender>
        ...
    </patient>
    """
    try:
        root = ET.fromstring(content)
        
        # Convert XML to dict
        data = {}
        for child in root:
            # Handle simple nested structures like blood_pressure
            if len(child) > 0:
                nested = {}
                for subchild in child:
                    nested[subchild.tag] = subchild.text
                data[child.tag] = nested
            else:
                data[child.tag] = child.text

        # Handle blood_pressure
        if "blood_pressure" in data and isinstance(data["blood_pressure"], dict):
            bp = data["blood_pressure"]
            data["blood_pressure_sys"] = bp.get("systolic")
            data["blood_pressure_dia"] = bp.get("diastolic")
            del data["blood_pressure"]
            
        # Handle medications (assuming comma separated or multiple tags)
        # For XML, it might be <medications><medication>A</medication><medication>B</medication></medications>
        # But our simple parser above might make it tricky if keys duplicate. 
        # Let's assume simple text content for now or specific structure handling if needed.
        # If the user provides <medications>A, B</medications> it works.
        
        return normalize_data(data)

    except ET.ParseError as e:
        logger.error("Error parsing XML: %s", e)
        raise HTTPException(status_code=400, detail=f"Invalid XML format: {str(e)}")
    except Exception as e:
        logger.error("Error processing XML: %s", e)
        raise HTTPException(status_code=400, detail=f"Failed to process XML: {str(e)}")


def normalize_data(data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Normalize parsed EHR data to consistent format.
    
    Returns:
    {
        "name": str,
        "age": int,
        "gender": str ("male" | "female" | "unknown"),
        "height_cm": int | None,
        "weight_kg": int | None,
        "blood_pressure_sys": int | None,
        "blood_pressure_dia": int | None,
        "heart_rate": int | None,
        "condition": str | None,
        "medications": list[str]
    }
    """
    normalized: Dict[str, Any] = {}
    
    # Name
    normalized["name"] = str(data.get("name", "Unknown")).strip()
    
    # Age
    age = data.get("age")
    if age is not None:
        normalized["age"] = int(age) if isinstance(age, (int, float)) else clean_number(age)
    else:
        normalized["age"] = None
    
    # Gender
    gender = str(data.get("gender", "unknown")).strip().lower()
    if gender.startswith("m") or gender == "1":
        normalized["gender"] = "male"
    elif gender.startswith("f") or gender == "2":
        normalized["gender"] = "female"
    else:
        normalized["gender"] = "unknown"
    
    # Height
    height = data.get("height_cm") or data.get("height")
    normalized["height_cm"] = int(height) if isinstance(height, (int, float)) else clean_number(height)
    
    # Weight
    weight = data.get("weight_kg") or data.get("weight")
    normalized["weight_kg"] = int(weight) if isinstance(weight, (int, float)) else clean_number(weight)
    
    # Blood Pressure
    normalized["blood_pressure_sys"] = (
        int(data.get("blood_pressure_sys") or data.get("bp_systolic") or data.get("systolic"))
        if data.get("blood_pressure_sys") or data.get("bp_systolic") or data.get("systolic")
        else None
    )
    if normalized["blood_pressure_sys"] is None:
        normalized["blood_pressure_sys"] = clean_number(data.get("blood_pressure_sys") or data.get("bp_systolic") or data.get("systolic"))
    
    normalized["blood_pressure_dia"] = (
        int(data.get("blood_pressure_dia") or data.get("bp_diastolic") or data.get("diastolic"))
        if data.get("blood_pressure_dia") or data.get("bp_diastolic") or data.get("diastolic")
        else None
    )
    if normalized["blood_pressure_dia"] is None:
        normalized["blood_pressure_dia"] = clean_number(data.get("blood_pressure_dia") or data.get("bp_diastolic") or data.get("diastolic"))
    
    # Heart Rate
    hr = data.get("heart_rate") or data.get("hr")
    normalized["heart_rate"] = int(hr) if isinstance(hr, (int, float)) else clean_number(hr)
    
    # Condition
    condition = data.get("condition") or data.get("conditions")
    if isinstance(condition, list):
        normalized["condition"] = ", ".join([str(c) for c in condition if c])
    else:
        normalized["condition"] = str(condition).strip() if condition else None
    
    # Medications
    meds = data.get("medications", [])
    if isinstance(meds, str):
        meds = [m.strip() for m in re.split(r"[;,]", meds) if m.strip()]
    elif not isinstance(meds, list):
        meds = []
    normalized["medications"] = [str(m).strip() for m in meds if m]
    
    return normalized

