"""
MedTriageSLM — Post-Training Evaluation
Evaluates schema compliance, urgency accuracy, and safety-critical metrics.

Usage:
    pip install transformers torch scikit-learn tqdm
    python evaluate.py --model YOUR_USERNAME/medtriage-smollm2-360m \
                       --test_data ../dataset/triage_dataset_test.json
"""

import json
import argparse
from collections import defaultdict
from transformers import AutoTokenizer, AutoModelForCausalLM
import torch
from tqdm import tqdm


SYSTEM_PROMPT = (
    "You are a medical triage assistant. Classify the patient's symptoms into one of: "
    "EMERGENCY, URGENT, SEMI_URGENT, NON_URGENT. "
    "Respond ONLY with valid JSON matching the triage schema. No preamble, no explanation outside the JSON."
)

URGENCY_LEVELS = ["EMERGENCY", "URGENT", "SEMI_URGENT", "NON_URGENT"]


def load_test_data(path: str) -> list:
    with open(path) as f:
        return json.load(f)


def run_inference(model, tokenizer, symptom: str, device: str) -> dict | None:
    prompt = f"[INST] {SYSTEM_PROMPT}\n\nPatient symptoms: {symptom} [/INST]"
    inputs = tokenizer(prompt, return_tensors="pt", truncation=True, max_length=512).to(device)

    with torch.no_grad():
        output = model.generate(
            **inputs,
            max_new_tokens=256,
            temperature=0.1,
            do_sample=False,
            pad_token_id=tokenizer.eos_token_id
        )

    generated = tokenizer.decode(output[0][inputs.input_ids.shape[1]:], skip_special_tokens=True)

    # Try to extract JSON from the response
    text = generated.strip()
    if text.startswith("```json"):
        text = text[7:]
    if text.startswith("```"):
        text = text[3:]
    if text.endswith("```"):
        text = text[:-3]
    text = text.strip()

    try:
        return json.loads(text)
    except json.JSONDecodeError:
        # Try to find JSON block within text
        start = text.find("{")
        end = text.rfind("}") + 1
        if start != -1 and end > start:
            try:
                return json.loads(text[start:end])
            except json.JSONDecodeError:
                return None
    return None


def validate_schema(output: dict) -> tuple[bool, list]:
    required_fields = ["urgency", "confidence", "esi_level", "reasoning",
                       "recommended_action", "red_flags", "do_not_send_home"]
    missing = [f for f in required_fields if f not in output]
    if missing:
        return False, missing

    if output.get("urgency") not in ["EMERGENCY", "URGENT", "SEMI_URGENT", "NON_URGENT"]:
        return False, ["urgency_invalid_value"]
    if not isinstance(output.get("confidence"), (int, float)):
        return False, ["confidence_not_numeric"]
    if output.get("esi_level") not in [1, 2, 3, 4, 5]:
        return False, ["esi_level_invalid"]

    return True, []


def evaluate(model_id: str, test_path: str):
    print(f"Loading model: {model_id}")
    device = "cuda" if torch.cuda.is_available() else "cpu"
    tokenizer = AutoTokenizer.from_pretrained(model_id)
    model = AutoModelForCausalLM.from_pretrained(model_id, torch_dtype=torch.float16).to(device)
    model.eval()

    test_data = load_test_data(test_path)
    print(f"Evaluating on {len(test_data)} test examples...")

    results = {
        "total": len(test_data),
        "parse_success": 0,
        "schema_valid": 0,
        "urgency_correct": 0,
        "do_not_send_home_tp": 0,
        "do_not_send_home_fn": 0,  # Most dangerous: said safe when not
        "per_class": defaultdict(lambda: {"tp": 0, "fp": 0, "fn": 0})
    }

    for item in tqdm(test_data, desc="Evaluating"):
        true_output = json.loads(item["output"])
        true_urgency = true_output["urgency"]
        true_dnsh = true_output["do_not_send_home"]

        pred = run_inference(model, tokenizer, item["input"], device)

        if pred is None:
            results["per_class"][true_urgency]["fn"] += 1
            if true_dnsh:
                results["do_not_send_home_fn"] += 1
            continue

        results["parse_success"] += 1

        valid, _ = validate_schema(pred)
        if valid:
            results["schema_valid"] += 1

        pred_urgency = pred.get("urgency", "UNKNOWN")
        pred_dnsh = pred.get("do_not_send_home", False)

        if pred_urgency == true_urgency:
            results["urgency_correct"] += 1
            results["per_class"][true_urgency]["tp"] += 1
        else:
            results["per_class"][true_urgency]["fn"] += 1
            results["per_class"][pred_urgency]["fp"] += 1

        if true_dnsh and pred_dnsh:
            results["do_not_send_home_tp"] += 1
        elif true_dnsh and not pred_dnsh:
            results["do_not_send_home_fn"] += 1

    n = results["total"]
    print("\n" + "="*55)
    print("MEDTRIAGELM EVALUATION RESULTS")
    print("="*55)
    print(f"Total examples       : {n}")
    print(f"Parse success rate   : {results['parse_success']/n*100:.1f}%")
    print(f"Schema compliance    : {results['schema_valid']/n*100:.1f}%")
    print(f"Urgency accuracy     : {results['urgency_correct']/n*100:.1f}%")

    dnsh_pos = results["do_not_send_home_tp"] + results["do_not_send_home_fn"]
    if dnsh_pos > 0:
        dnsh_recall = results["do_not_send_home_tp"] / dnsh_pos
        print(f"Do-not-send-home recall: {dnsh_recall*100:.1f}%  ← SAFETY CRITICAL")

    print("\nPer-class F1:")
    for level in URGENCY_LEVELS:
        cls = results["per_class"][level]
        tp, fp, fn = cls["tp"], cls["fp"], cls["fn"]
        prec = tp/(tp+fp) if (tp+fp) > 0 else 0
        rec = tp/(tp+fn) if (tp+fn) > 0 else 0
        f1 = 2*prec*rec/(prec+rec) if (prec+rec) > 0 else 0
        print(f"  {level:12s}: P={prec:.2f} R={rec:.2f} F1={f1:.2f}")

    print("="*55)


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--model", required=True, help="HuggingFace model ID")
    parser.add_argument("--test_data", required=True, help="Path to test JSON file")
    args = parser.parse_args()
    evaluate(args.model, args.test_data)
