"""
MedTriageSLM — Synthetic Dataset Generator
Generates Smolify-compatible instruction-tuning pairs for medical triage classification.

Usage:
    pip install openai pandas tqdm
    python generate_synthetic.py --count 2000 --output triage_dataset.json

Smolify upload format:
    Each record: {"instruction": "...", "input": "...", "output": "..."}
    Output is strict JSON matching the triage schema.
"""

import json
import random
import argparse
from pathlib import Path

# ─── Symptom templates by urgency tier ────────────────────────────────────────

SYMPTOM_BANK = {
    "EMERGENCY": {
        "esi_level": 1,
        "templates": [
            ("chest pain radiating to {side} arm, {duration}, {sweat}", ["left","right"], ["5 minutes","20 minutes","1 hour"], ["sweating","diaphoresis","cold sweat"]),
            ("{age} year old, sudden severe headache described as worst of life, {symptom}", None, None, ["nausea","vomiting","neck stiffness","photophobia"]),
            ("signs of stroke: {features}, onset {duration}", None, None, ["facial droop","arm weakness","slurred speech","confusion"]),
            ("unresponsive {age} year old, {cause}", ["60","72","55","80"], None, ["found on floor","after seizure","unknown cause"]),
            ("severe allergic reaction, {features}", None, None, ["throat swelling","wheezing","hives covering body","hypotension"]),
            ("major trauma: {mechanism}, {injuries}", None, None, ["hit by vehicle","fall from height","stabbing","shooting"]),
            ("respiratory distress, O2 sat {spo2}%, {features}", ["82","78","85","70"], None, ["accessory muscle use","cyanosis","cannot speak in full sentences"]),
            ("sudden vision loss in {side} eye, {duration}", ["left","right"], ["minutes","1 hour"], ["painless","associated with headache"]),
            ("suspected overdose, {drug}, {status}", None, None, ["unresponsive","shallow breathing","pinpoint pupils","unknown substances"]),
            ("severe burns {pct}% BSA, {location}", ["20","35","40"], None, ["face and neck","hands and airway","circumferential"]),
        ]
    },
    "URGENT": {
        "esi_level": 2,
        "templates": [
            ("high fever {temp}°C in {age} year old child, {duration}", ["39.4","39.8","40.1"], ["infant","2 year old","5 year old"], ["4 hours","overnight","2 days"]),
            ("compound fracture {bone}, deformity visible", None, None, ["forearm","tibia","fibula","radius"]),
            ("sudden severe abdominal pain, {location}, {features}", None, None, ["RLQ with rebound tenderness","epigastric with vomiting","periumbilical radiating to back"]),
            ("hypertensive urgency, BP {bp}, {symptoms}", ["190/120","200/130","185/115"], None, ["headache","blurred vision","no end-organ damage yet"]),
            ("asthma attack, partially responsive to inhaler, RR {rr}", ["26","30","24"], None, None),
            ("acute psychiatric emergency: {presentation}", None, None, ["active suicidal ideation with plan","auditory hallucinations commanding self-harm","acute psychosis with aggression"]),
            ("possible appendicitis: {features}", None, None, ["RLQ pain, fever 38.5, nausea","pain worse with movement, guarding","positive Rovsing sign"]),
            ("diabetic: BGL {bgl} mmol/L, {symptoms}", ["2.1","1.8","22","28"], None, ["confused","diaphoretic","kussmaul breathing"]),
            ("moderate head injury, {features}", None, None, ["brief LOC, now GCS 14","vomiting twice","laceration with bleeding"]),
            ("severe vomiting {count} times in {hours} hours, dehydrated", ["8","12","15"], ["6","8","12"], None),
        ]
    },
    "SEMI_URGENT": {
        "esi_level": 3,
        "templates": [
            ("ear pain and discharge {duration}, fever {temp}°C", ["2 days","3 days","1 week"], ["38.0","37.8","38.2"], None),
            ("sprained {joint}, unable to weight-bear, swelling present", None, None, ["ankle","wrist","knee"]),
            ("urinary tract infection symptoms: {features}", None, None, ["burning, frequency, cloudy urine","pelvic pain, urgency","haematuria, mild fever"]),
            ("lacerations requiring sutures, {location}, {length}cm, bleeding controlled", None, None, ["forearm","scalp","chin"], None),
            ("moderate back pain, {onset}, {features}", ["sudden onset lifting","gradual","after MVA"], None, ["no radiation","radiculopathy to knee","muscle spasm"]),
            ("tooth pain, {severity}, {duration}", ["severe","moderate"], ["2 days","1 week"], None),
            ("eye redness and discharge {eye}, {duration}", ["left","right","bilateral"], ["3 days","1 week"], None),
            ("mild asthma exacerbation, responding to {puffs} puffs salbutamol", ["4","6"], None, None),
            ("allergic reaction, {features}, no airway involvement", None, None, ["hives on arms","urticaria","mild itching and rash"]),
            ("suspected UTI in {age} year old male, {features}", ["70","75","65"], None, ["confusion, fever 38.3","dysuria, frequency"]),
        ]
    },
    "NON_URGENT": {
        "esi_level": 4,
        "templates": [
            ("mild sore throat, {duration}, no difficulty swallowing", ["2 days","3 days","1 week"], None, None),
            ("common cold symptoms: {features}, {duration}", None, ["3 days","5 days","1 week"], ["runny nose, mild cough","sneezing, sore throat","nasal congestion"]),
            ("prescription refill request: {medication}", None, None, ["metformin","amlodipine","atorvastatin","omeprazole"]),
            ("minor abrasion {location}, cleaned at home, no deep injury", None, None, ["knee","elbow","palm"]),
            ("mild headache, {features}, paracetamol not yet tried", None, None, ["tension-type","behind eyes","frontal"]),
            ("insect bite, mild swelling, no signs of infection, {duration}", ["yesterday","2 days ago"], None, None),
            ("skin rash, {features}, no fever, spreading slowly", None, None, ["dry and flaky","mild itch","erythematous patches"]),
            ("tired and fatigue, {duration}, no acute symptoms", ["2 weeks","1 month","several days"], None, None),
            ("requesting medical certificate for work absence", None, None, None),
            ("mild nausea, {vomit}, no blood, tolerating fluids", ["no vomiting","vomited once"], None, None),
        ]
    }
}

REASONING_TEMPLATES = {
    "EMERGENCY": [
        "Presentation strongly suggests {diagnosis}. Immediate intervention required to prevent {consequence}.",
        "Classic {diagnosis} features present. Time-critical condition with risk of {consequence}.",
        "High-acuity presentation: {features}. Delay could result in {consequence}.",
    ],
    "URGENT": [
        "Condition requires assessment and treatment within 30-60 minutes. Risk of deterioration to emergency if untreated.",
        "Moderately serious presentation. Close monitoring required; can escalate rapidly.",
        "Significant acute condition requiring prompt evaluation. Stable currently but time-sensitive.",
    ],
    "SEMI_URGENT": [
        "Condition is uncomfortable but not immediately life-threatening. Should be seen within 2-4 hours.",
        "Non-critical but requires same-day assessment. Unlikely to deteriorate rapidly.",
        "Acute condition requiring evaluation today, but stable enough for brief wait.",
    ],
    "NON_URGENT": [
        "Minor complaint with no red flag features. Can safely wait or be redirected to GP/primary care.",
        "Low-acuity presentation. Patient is stable and comfortable. Consider same-day GP appointment.",
        "No acute or emergency features identified. Suitable for routine primary care management.",
    ]
}

ACTIONS = {
    "EMERGENCY": [
        "Immediate resuscitation bay. Activate trauma/code team. Continuous monitoring.",
        "Direct to resus. IV access x2, bloods, ECG, senior clinician immediately.",
        "Immediate physician review. Do not leave unattended. Activate relevant specialty team.",
    ],
    "URGENT": [
        "Seen by doctor within 30 minutes. Bloods and imaging as indicated.",
        "Nurse assessment immediately, physician within 30 minutes. Analgesia as appropriate.",
        "Priority queue. IV access if indicated. Repeat vitals every 15 minutes.",
    ],
    "SEMI_URGENT": [
        "Seen within 2 hours. Analgesia offered. Reassess if condition changes.",
        "Wait time estimate 1-3 hours. Alert staff if symptoms worsen.",
        "Register and wait. Nursing assessment within 30 minutes. Physician within 2 hours.",
    ],
    "NON_URGENT": [
        "Consider redirecting to GP or after-hours clinic. ED wait time 3-4+ hours.",
        "Register and wait. Estimated wait 3-5 hours. GP referral letter offered.",
        "Suitable for primary care setting. Offer GP/urgent care referral if preferred.",
    ]
}

RED_FLAGS = {
    "EMERGENCY": ["airway_compromise","haemodynamic_instability","altered_consciousness","active_haemorrhage","respiratory_failure"],
    "URGENT": ["fever_child","significant_pain","functional_impairment","potential_sepsis","psychiatric_risk"],
    "SEMI_URGENT": ["infection_signs","dehydration_risk","injury_requiring_repair","acute_pain"],
    "NON_URGENT": []
}


def build_symptom(urgency: str) -> str:
    tier = SYMPTOM_BANK[urgency]
    template_group = random.choice(tier["templates"])
    template = template_group[0]
    pools = template_group[1:]

    result = template
    placeholders = [p.strip("{}") for p in template.split("{")[1:] if "}" in p]
    for i, ph in enumerate(placeholders):
        pool = pools[i] if i < len(pools) and pools[i] else None
        if pool:
            result = result.replace("{" + ph + "}", random.choice(pool), 1)
        else:
            result = result.replace("{" + ph + "}", "", 1)

    age = random.randint(18, 85)
    result = result.replace("{age}", str(age))
    return result.strip().rstrip(",").strip()


def build_output(urgency: str, symptom: str) -> dict:
    tier = SYMPTOM_BANK[urgency]
    reasoning_tmpl = random.choice(REASONING_TEMPLATES[urgency])
    reasoning = reasoning_tmpl.replace("{diagnosis}", "acute condition").replace(
        "{consequence}", "rapid deterioration").replace("{features}", symptom[:60])

    flags = random.sample(RED_FLAGS[urgency], min(len(RED_FLAGS[urgency]), random.randint(1, 3)))
    confidence = round(random.uniform(0.82, 0.99), 2)

    return {
        "urgency": urgency,
        "confidence": confidence,
        "esi_level": tier["esi_level"],
        "reasoning": reasoning,
        "recommended_action": random.choice(ACTIONS[urgency]),
        "red_flags": flags,
        "do_not_send_home": urgency in ["EMERGENCY", "URGENT"]
    }


def generate_dataset(count: int) -> list:
    urgency_levels = ["EMERGENCY", "URGENT", "SEMI_URGENT", "NON_URGENT"]
    # Distribution: 15% emergency, 30% urgent, 30% semi, 25% non-urgent
    weights = [0.15, 0.30, 0.30, 0.25]

    records = []
    for _ in range(count):
        urgency = random.choices(urgency_levels, weights=weights)[0]
        symptom = build_symptom(urgency)
        output = build_output(urgency, symptom)

        records.append({
            "instruction": (
                "You are a medical triage assistant. Classify the patient's symptoms into one of: "
                "EMERGENCY, URGENT, SEMI_URGENT, NON_URGENT. "
                "Respond ONLY with valid JSON matching the triage schema. No preamble, no explanation outside the JSON."
            ),
            "input": symptom,
            "output": json.dumps(output)
        })

    random.shuffle(records)
    return records


def main():
    parser = argparse.ArgumentParser(description="Generate synthetic medical triage dataset")
    parser.add_argument("--count", type=int, default=2000, help="Number of training examples")
    parser.add_argument("--output", type=str, default="triage_dataset.json", help="Output file path")
    parser.add_argument("--split", action="store_true", help="Split into train/val/test files")
    args = parser.parse_args()

    print(f"Generating {args.count} synthetic triage examples...")
    records = generate_dataset(args.count)

    if args.split:
        n_train = int(args.count * 0.8)
        n_val = int(args.count * 0.1)
        train = records[:n_train]
        val = records[n_train:n_train+n_val]
        test = records[n_train+n_val:]

        base = Path(args.output).stem
        for split_name, split_data in [("train", train), ("val", val), ("test", test)]:
            path = f"{base}_{split_name}.json"
            with open(path, "w") as f:
                json.dump(split_data, f, indent=2)
            print(f"  Saved {len(split_data)} {split_name} examples → {path}")
    else:
        with open(args.output, "w") as f:
            json.dump(records, f, indent=2)
        print(f"Saved {len(records)} examples → {args.output}")

    # Print distribution summary
    from collections import Counter
    dist = Counter(json.loads(r["output"])["urgency"] for r in records)
    print("\nUrgency distribution:")
    for level, cnt in sorted(dist.items()):
        print(f"  {level:12s}: {cnt:4d} ({cnt/len(records)*100:.1f}%)")

    print("\nSmolify upload: Push this file to HuggingFace Datasets as JSONL format.")
    print("Each record must have: instruction, input, output fields.")


if __name__ == "__main__":
    main()
