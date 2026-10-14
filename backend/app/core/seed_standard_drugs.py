"""
WHO Model List of Essential Medicines (EML) & NIH RxNav REST API Seeder
Populates the clinic database with:
1. Standard generic essential molecules from WHO Model List of Essential Medicines (23rd List)
2. Live enrichment via NIH RxNav REST API (RxCUI and WHO ATC classification)
3. ICD-10 disease indication mapping (clinical_disease_indications)
4. Commercial pharmacy trade brand aliases (brand_trade_products)
"""

import json
import urllib.parse
import urllib.request
from concurrent.futures import ThreadPoolExecutor
from typing import Dict, Any, Optional, Tuple, List
from app.core.database import get_connection

# Official WHO Model List of Essential Medicines (23rd List, 2023) - Core Primary Care Catalog
WHO_EML_CATALOG = [
    # --- 1. Medicines for Pain and Palliative Care ---
    {"name": "paracetamol", "display": "Paracetamol", "atc": "N02BE01", "class": "Aniline Analgesic & Antipyretic", "form": "TABLET", "strength": "500mg", "route": "ORAL", "sched": "1 tab TDS/SOS (max 3/day)", "preg": "B", "ci": "Severe acute liver failure, active end-stage hepatic disease"},
    {"name": "paracetamol", "display": "Paracetamol", "atc": "N02BE01", "class": "Aniline Analgesic & Antipyretic", "form": "TABLET", "strength": "650mg", "route": "ORAL", "sched": "1 tab TDS/SOS (max 3/day)", "preg": "B", "ci": "Severe acute liver failure, active end-stage hepatic disease"},
    {"name": "paracetamol", "display": "Paracetamol", "atc": "N02BE01", "class": "Aniline Analgesic & Antipyretic", "form": "SYRUP", "strength": "120mg/5ml", "route": "ORAL", "sched": "5–10ml SOS (pediatric)", "preg": "B", "ci": "Severe acute liver disease"},
    {"name": "ibuprofen", "display": "Ibuprofen", "atc": "M01AE01", "class": "Nonsteroidal Anti-inflammatory Drug (NSAID)", "form": "TABLET", "strength": "400mg", "route": "ORAL", "sched": "1 tab BD after meals", "preg": "C", "ci": "Active peptic ulcer, severe renal failure, 3rd trimester pregnancy, aspirin-induced asthma"},
    {"name": "aspirin", "display": "Acetylsalicylic acid", "atc": "B01AC06", "class": "Antiplatelet / Salicylate NSAID", "form": "TABLET", "strength": "75mg", "route": "ORAL", "sched": "1 tab OD post-lunch", "preg": "D", "ci": "Active GI bleeding, hemophilia, children < 16 yrs (Reye syndrome)"},
    {"name": "tramadol", "display": "Tramadol", "atc": "N02AX02", "class": "Opioid Analgesic", "form": "TABLET", "strength": "50mg", "route": "ORAL", "sched": "1 tab BD/TDS SOS for severe pain", "preg": "C", "ci": "Severe respiratory depression, acute intoxication with alcohol/sedatives, concurrent MAOI"},
    {"name": "morphine", "display": "Morphine", "atc": "N02AA01", "class": "Opioid Analgesic", "form": "TABLET", "strength": "10mg", "route": "ORAL", "sched": "1 tab Q4H as prescribed for severe palliative pain", "preg": "C", "ci": "Acute respiratory depression, paralytic ileus, severe bronchial asthma"},

    # --- 2. Antiallergics and Medicines Used in Anaphylaxis ---
    {"name": "dexamethasone", "display": "Dexamethasone", "atc": "H02AB02", "class": "Glucocorticoid Anti-inflammatory", "form": "TABLET", "strength": "4mg", "route": "ORAL", "sched": "1 tab OD morning after meals", "preg": "C", "ci": "Systemic fungal infection, live virus vaccines, untreated active tuberculosis"},
    {"name": "hydrocortisone", "display": "Hydrocortisone", "atc": "H02AB09", "class": "Short-acting Corticosteroid", "form": "INJECTION", "strength": "100mg", "route": "IV/IM", "sched": "100mg IV stat in emergency / anaphylaxis", "preg": "C", "ci": "Systemic fungal infections, hypersensitivity"},
    {"name": "epinephrine", "display": "Epinephrine", "atc": "C01CA24", "class": "Adrenergic Vasopressor & Bronchodilator", "form": "INJECTION", "strength": "1mg/ml", "route": "IM", "sched": "0.3–0.5mg IM stat in anaphylactic shock", "preg": "C", "ci": "No absolute contraindications in life-threatening anaphylaxis"},
    {"name": "cetirizine", "display": "Cetirizine", "atc": "R06AE07", "class": "Second-Generation H1 Antihistamine", "form": "TABLET", "strength": "10mg", "route": "ORAL", "sched": "1 tab OD at bedtime", "preg": "B", "ci": "End-stage renal disease (CrCl < 10 mL/min)"},
    {"name": "loratadine", "display": "Loratadine", "atc": "R06AX13", "class": "Non-sedating H1 Antihistamine", "form": "TABLET", "strength": "10mg", "route": "ORAL", "sched": "1 tab OD morning", "preg": "B", "ci": "Severe hepatic impairment, hypersensitivity"},

    # --- 3. Anti-Infective Medicines (Antibacterials, Antifungals, Antivirals) ---
    {"name": "amoxicillin", "display": "Amoxicillin", "atc": "J01CA04", "class": "Extended-Spectrum Penicillin", "form": "CAPSULE", "strength": "500mg", "route": "ORAL", "sched": "1 cap TDS for 5 days", "preg": "B", "ci": "Known penicillin or beta-lactam hypersensitivity, infectious mononucleosis"},
    {"name": "amoxicillin / clavulanate", "display": "Amoxicillin + Clavulanic acid", "atc": "J01CR02", "class": "Beta-Lactam + Beta-Lactamase Inhibitor", "form": "TABLET", "strength": "625mg", "route": "ORAL", "sched": "1 tab BD for 5–7 days", "preg": "B", "ci": "Penicillin allergy, history of amoxicillin-clavulanate jaundice"},
    {"name": "azithromycin", "display": "Azithromycin", "atc": "J01FA10", "class": "Macrolide Antibacterial", "form": "TABLET", "strength": "500mg", "route": "ORAL", "sched": "1 tab OD 1 hr before meals for 3 days", "preg": "B", "ci": "Macrolide hypersensitivity, QT prolongation, myasthenia gravis"},
    {"name": "cefixime", "display": "Cefixime", "atc": "J01DD08", "class": "Third-Generation Cephalosporin", "form": "TABLET", "strength": "200mg", "route": "ORAL", "sched": "1 tab BD for 5 days", "preg": "B", "ci": "Cephalosporin allergy, severe immediate penicillin anaphylaxis"},
    {"name": "ceftriaxone", "display": "Ceftriaxone", "atc": "J01DD04", "class": "Third-Generation Cephalosporin", "form": "INJECTION", "strength": "1g", "route": "IV/IM", "sched": "1g IV/IM OD or BD stat", "preg": "B", "ci": "Hyperbilirubinemic neonates, concurrent IV calcium administration"},
    {"name": "ciprofloxacin", "display": "Ciprofloxacin", "atc": "J01MA02", "class": "Fluoroquinolone Antibacterial", "form": "TABLET", "strength": "500mg", "route": "ORAL", "sched": "1 tab BD for 5–7 days", "preg": "C", "ci": "Tendon rupture history, myasthenia gravis, pregnancy, fluoroquinolone allergy"},
    {"name": "doxycycline", "display": "Doxycycline", "atc": "J01AA02", "class": "Tetracycline Antibacterial", "form": "CAPSULE", "strength": "100mg", "route": "ORAL", "sched": "1 cap BD on day 1, then OD for 7 days", "preg": "D", "ci": "Children < 8 years, pregnancy, severe hepatic impairment, tetracycline allergy"},
    {"name": "metronidazole", "display": "Metronidazole", "atc": "J01XD01", "class": "Nitroimidazole Antiprotozoal & Antibacterial", "form": "TABLET", "strength": "400mg", "route": "ORAL", "sched": "1 tab TDS with meals for 5–7 days", "preg": "B", "ci": "First trimester pregnancy, chronic alcoholism, concurrent disulfiram"},
    {"name": "nitrofurantoin", "display": "Nitrofurantoin", "atc": "J01XE01", "class": "Nitrofuran Urinary Antibacterial", "form": "CAPSULE", "strength": "100mg", "route": "ORAL", "sched": "1 cap BD with meals for 5 days", "preg": "B", "ci": "eGFR < 30 mL/min, 38–42 weeks pregnancy (hemolytic anemia risk)"},
    {"name": "fluconazole", "display": "Fluconazole", "atc": "J02AC01", "class": "Triazole Antifungal", "form": "TABLET", "strength": "150mg", "route": "ORAL", "sched": "1 tab stat single dose or once weekly", "preg": "D", "ci": "Co-administration with terfenadine, cisapride, QT prolongation, pregnancy"},
    {"name": "clotrimazole", "display": "Clotrimazole", "atc": "D01AC01", "class": "Imidazole Antifungal", "form": "CREAM", "strength": "1%", "route": "TOPICAL", "sched": "Apply gently to affected area BD for 2 weeks", "preg": "B", "ci": "Hypersensitivity to imidazoles"},
    {"name": "acyclovir", "display": "Acyclovir", "atc": "J05AB01", "class": "Synthetic Purine Nucleoside Antiviral", "form": "TABLET", "strength": "400mg", "route": "ORAL", "sched": "1 tab 5 times daily for 5–7 days", "preg": "B", "ci": "Hypersensitivity to acyclovir or valacyclovir, renal impairment"},

    # --- 4. Cardiovascular Medicines (Antihypertensives, Antianginals, Statins) ---
    {"name": "amlodipine", "display": "Amlodipine", "atc": "C08CA01", "class": "Calcium Channel Blocker (Dihydropyridine)", "form": "TABLET", "strength": "5mg", "route": "ORAL", "sched": "1 tab OD morning", "preg": "C", "ci": "Severe hypotension, cardiogenic shock, severe aortic stenosis"},
    {"name": "amlodipine", "display": "Amlodipine", "atc": "C08CA01", "class": "Calcium Channel Blocker (Dihydropyridine)", "form": "TABLET", "strength": "10mg", "route": "ORAL", "sched": "1 tab OD morning", "preg": "C", "ci": "Severe hypotension, cardiogenic shock, severe aortic stenosis"},
    {"name": "enalapril", "display": "Enalapril", "atc": "C09AA02", "class": "Angiotensin-Converting Enzyme (ACE) Inhibitor", "form": "TABLET", "strength": "5mg", "route": "ORAL", "sched": "1 tab OD or BD", "preg": "D", "ci": "History of angioedema with ACEi, bilateral renal artery stenosis, pregnancy"},
    {"name": "losartan", "display": "Losartan", "atc": "C09CA01", "class": "Angiotensin II Receptor Blocker (ARB)", "form": "TABLET", "strength": "50mg", "route": "ORAL", "sched": "1 tab OD morning", "preg": "D", "ci": "Pregnancy, bilateral renal artery stenosis, concurrent aliskiren in diabetes"},
    {"name": "telmisartan", "display": "Telmisartan", "atc": "C09CA07", "class": "Angiotensin II Receptor Blocker (ARB)", "form": "TABLET", "strength": "40mg", "route": "ORAL", "sched": "1 tab OD morning", "preg": "D", "ci": "Pregnancy, bilateral renal artery stenosis, biliary obstructive disorders"},
    {"name": "atenolol", "display": "Atenolol", "atc": "C07AB03", "class": "Cardioselective Beta-1 Blocker", "form": "TABLET", "strength": "50mg", "route": "ORAL", "sched": "1 tab OD morning", "preg": "D", "ci": "Sinus bradycardia, heart block > 1st degree, cardiogenic shock, severe asthma"},
    {"name": "bisoprolol", "display": "Bisoprolol", "atc": "C07AB07", "class": "Cardioselective Beta-1 Blocker", "form": "TABLET", "strength": "2.5mg", "route": "ORAL", "sched": "1 tab OD morning", "preg": "C", "ci": "Acute decompensated heart failure, severe bradycardia, cardiogenic shock"},
    {"name": "hydrochlorothiazide", "display": "Hydrochlorothiazide", "atc": "C03AA03", "class": "Thiazide Diuretic", "form": "TABLET", "strength": "12.5mg", "route": "ORAL", "sched": "1 tab OD morning", "preg": "B", "ci": "Anuria, severe renal impairment (CrCl < 30 mL/min), refractory hypokalemia"},
    {"name": "furosemide", "display": "Furosemide", "atc": "C03CA01", "class": "Loop Diuretic", "form": "TABLET", "strength": "40mg", "route": "ORAL", "sched": "1 tab OD morning after food", "preg": "C", "ci": "Anuria, severe electrolyte depletion, hepatic coma, hypersensitivity to sulfonamides"},
    {"name": "spironolactone", "display": "Spironolactone", "atc": "C03DA01", "class": "Aldosterone Receptor Antagonist (K-Sparing)", "form": "TABLET", "strength": "25mg", "route": "ORAL", "sched": "1 tab OD with food", "preg": "C", "ci": "Hyperkalemia (K > 5.5 mEq/L), Addison disease, severe renal insufficiency"},
    {"name": "clopidogrel", "display": "Clopidogrel", "atc": "B01AC04", "class": "Thienopyridine P2Y12 Antiplatelet", "form": "TABLET", "strength": "75mg", "route": "ORAL", "sched": "1 tab OD", "preg": "B", "ci": "Active pathological bleeding (peptic ulcer or intracranial hemorrhage)"},
    {"name": "atorvastatin", "display": "Atorvastatin", "atc": "C10AA05", "class": "HMG-CoA Reductase Inhibitor (Statin)", "form": "TABLET", "strength": "10mg", "route": "ORAL", "sched": "1 tab OD bedtime", "preg": "X", "ci": "Active liver disease, pregnancy, breastfeeding, unexplained persistent transaminase elevation"},
    {"name": "atorvastatin", "display": "Atorvastatin", "atc": "C10AA05", "class": "HMG-CoA Reductase Inhibitor (Statin)", "form": "TABLET", "strength": "20mg", "route": "ORAL", "sched": "1 tab OD bedtime", "preg": "X", "ci": "Active liver disease, pregnancy, breastfeeding, unexplained persistent transaminase elevation"},
    {"name": "nitroglycerin", "display": "Glyceryl trinitrate", "atc": "C01DA02", "class": "Organic Nitrate Vasodilator", "form": "SUBLINGUAL_TABLET", "strength": "0.5mg", "route": "SUBLINGUAL", "sched": "1 tab sublingually stat at onset of chest pain (repeat q5min max 3 tabs)", "preg": "C", "ci": "Severe anemia, concurrent PDE-5 inhibitors (sildenafil/tadalafil), closed-angle glaucoma"},

    # --- 5. Medicines for Endocrine Disorders (Diabetes, Thyroid) ---
    {"name": "metformin", "display": "Metformin", "atc": "A10BA02", "class": "Biguanide Antihyperglycemic", "form": "TABLET", "strength": "500mg", "route": "ORAL", "sched": "1 tab BD with meals", "preg": "B", "ci": "Severe renal impairment (eGFR < 30 mL/min), acute metabolic acidosis, severe hypoxemia"},
    {"name": "metformin", "display": "Metformin", "atc": "A10BA02", "class": "Biguanide Antihyperglycemic", "form": "TABLET", "strength": "1000mg", "route": "ORAL", "sched": "1 tab BD with meals", "preg": "B", "ci": "Severe renal impairment (eGFR < 30 mL/min), acute metabolic acidosis, severe hypoxemia"},
    {"name": "glimepiride", "display": "Glimepiride", "atc": "A10BB12", "class": "Second-Generation Sulfonylurea", "form": "TABLET", "strength": "2mg", "route": "ORAL", "sched": "1 tab OD before breakfast", "preg": "C", "ci": "Diabetic ketoacidosis, severe renal or hepatic failure, sulfonamide hypersensitivity"},
    {"name": "insulin regular", "display": "Insulin (Human Regular)", "atc": "A10AB01", "class": "Short-Acting Human Insulin", "form": "INJECTION", "strength": "100 IU/ml", "route": "SUBCUTANEOUS", "sched": "Subcutaneously 30 mins before meals as per sliding scale", "preg": "B", "ci": "Hypoglycemia episodes"},
    {"name": "insulin glargine", "display": "Insulin Glargine", "atc": "A10AE04", "class": "Long-Acting Basal Insulin Analogue", "form": "INJECTION", "strength": "100 IU/ml", "route": "SUBCUTANEOUS", "sched": "Subcutaneously once daily at bedtime", "preg": "C", "ci": "Hypoglycemia episodes"},
    {"name": "levothyroxine", "display": "Levothyroxine", "atc": "H03AA01", "class": "Synthetic Thyroid Hormone (T4)", "form": "TABLET", "strength": "50mcg", "route": "ORAL", "sched": "1 tab OD empty stomach early morning", "preg": "A", "ci": "Uncorrected adrenal insufficiency, untreated thyrotoxicosis, acute myocardial infarction"},
    {"name": "prednisolone", "display": "Prednisolone", "atc": "H02AB06", "class": "Glucocorticoid Anti-inflammatory", "form": "TABLET", "strength": "5mg", "route": "ORAL", "sched": "1–4 tabs OD morning with food as tapered", "preg": "C", "ci": "Systemic infections, live vaccines, severe active peptic ulceration"},

    # --- 6. Gastrointestinal Medicines ---
    {"name": "pantoprazole", "display": "Pantoprazole", "atc": "A02BC02", "class": "Proton Pump Inhibitor (PPI)", "form": "TABLET", "strength": "40mg", "route": "ORAL", "sched": "1 tab OD 30 mins before breakfast", "preg": "B", "ci": "Known hypersensitivity to substituted benzimidazoles, severe hypomagnesemia"},
    {"name": "omeprazole", "display": "Omeprazole", "atc": "A02BC01", "class": "Proton Pump Inhibitor (PPI)", "form": "CAPSULE", "strength": "20mg", "route": "ORAL", "sched": "1 cap OD 30 mins before morning meal", "preg": "C", "ci": "Hypersensitivity to PPIs, concurrent rilpivirine co-administration"},
    {"name": "ondansetron", "display": "Ondansetron", "atc": "A04AA01", "class": "5-HT3 Receptor Antagonist (Antiemetic)", "form": "TABLET", "strength": "4mg", "route": "ORAL", "sched": "1 tab TDS SOS for nausea", "preg": "B", "ci": "Congenital long QT syndrome, concurrent apomorphine use"},
    {"name": "metoclopramide", "display": "Metoclopramide", "atc": "A03FA01", "class": "Dopamine D2 Receptor Antagonist (Prokinetic)", "form": "TABLET", "strength": "10mg", "route": "ORAL", "sched": "1 tab TDS 30 mins before meals", "preg": "B", "ci": "Gastrointestinal hemorrhage, mechanical obstruction/perforation, pheochromocytoma"},
    {"name": "oral rehydration salts", "display": "Oral Rehydration Salts (WHO-ORS)", "atc": "A07CA", "class": "Oral Electrolyte Replacement Formula", "form": "SACHET", "strength": "20.5g/L", "route": "ORAL", "sched": "Dissolve 1 sachet in 1 liter clean water; sip frequently", "preg": "A", "ci": "Severe intractable vomiting, paralytic ileus, severe hemodynamic shock"},
    {"name": "zinc sulfate", "display": "Zinc sulfate", "atc": "A12CB01", "class": "Trace Mineral Supplement", "form": "TABLET", "strength": "20mg", "route": "ORAL", "sched": "1 tab OD for 14 days in acute childhood diarrhea", "preg": "A", "ci": "Copper deficiency (prolonged high-dose use)"},
    {"name": "loperamide", "display": "Loperamide", "atc": "A07DA03", "class": "Peripheral Opioid Mu-Receptor Antidiarrheal", "form": "CAPSULE", "strength": "2mg", "route": "ORAL", "sched": "2 caps stat, then 1 cap after each unformed stool (max 8 caps/day)", "preg": "B", "ci": "Acute dysentery (bloody diarrhea + high fever), acute ulcerative colitis, children < 2 yrs"},

    # --- 7. Medicines Acting on the Respiratory Tract ---
    {"name": "salbutamol", "display": "Salbutamol", "atc": "R03AC02", "class": "Short-Acting Beta-2 Agonist (Bronchodilator)", "form": "INHALER", "strength": "100mcg/puff", "route": "INHALATION", "sched": "1–2 puffs PRN / Q4–6H for acute wheeze", "preg": "C", "ci": "Hypersensitivity to salbutamol, severe tachyarrhythmias"},
    {"name": "budesonide", "display": "Budesonide", "atc": "R03BA02", "class": "Inhaled Corticosteroid", "form": "INHALER", "strength": "200mcg/puff", "route": "INHALATION", "sched": "2 puffs BD with thorough mouth rinse after use", "preg": "B", "ci": "Status asthmaticus acute rescue, untreated active fungal airway infection"},
    {"name": "ipratropium", "display": "Ipratropium bromide", "atc": "R03BB01", "class": "Short-Acting Anticholinergic Bronchodilator", "form": "INHALER", "strength": "20mcg/puff", "route": "INHALATION", "sched": "2 puffs TDS or Q6H", "preg": "B", "ci": "Hypersensitivity to atropine derivatives, closed-angle glaucoma"},
    {"name": "montelukast", "display": "Montelukast", "atc": "R03DC03", "class": "Leukotriene Receptor Antagonist", "form": "TABLET", "strength": "10mg", "route": "ORAL", "sched": "1 tab OD in the evening", "preg": "B", "ci": "Hypersensitivity to montelukast, acute asthma attack monotherapy"},

    # --- 8. Medicines for Mental and Behavioural Disorders ---
    {"name": "escitalopram", "display": "Escitalopram", "atc": "N06AB10", "class": "Selective Serotonin Reuptake Inhibitor (SSRI)", "form": "TABLET", "strength": "10mg", "route": "ORAL", "sched": "1 tab OD morning", "preg": "C", "ci": "Concurrent MAOI therapy, pimozide co-administration, uncorrected QT prolongation"},
    {"name": "fluoxetine", "display": "Fluoxetine", "atc": "N06AB03", "class": "Selective Serotonin Reuptake Inhibitor (SSRI)", "form": "CAPSULE", "strength": "20mg", "route": "ORAL", "sched": "1 cap OD morning with breakfast", "preg": "C", "ci": "Concurrent MAOIs, thioridazine, pimozide"},
    {"name": "sertraline", "display": "Sertraline", "atc": "N06AB06", "class": "Selective Serotonin Reuptake Inhibitor (SSRI)", "form": "TABLET", "strength": "50mg", "route": "ORAL", "sched": "1 tab OD with food", "preg": "C", "ci": "Concurrent MAOIs, pimozide"},
    {"name": "diazepam", "display": "Diazepam", "atc": "N05BA01", "class": "Benzodiazepine Anxiolytic & Anticonvulsant", "form": "TABLET", "strength": "5mg", "route": "ORAL", "sched": "1 tab BD/TDS short-term for acute muscle spasm/anxiety", "preg": "D", "ci": "Myasthenia gravis, severe respiratory insufficiency, sleep apnea syndrome"},
    {"name": "lorazepam", "display": "Lorazepam", "atc": "N05BA06", "class": "Short/Intermediate-Acting Benzodiazepine", "form": "TABLET", "strength": "1mg", "route": "ORAL", "sched": "1 tab OD/BD short-term for acute severe anxiety/insomnia", "preg": "D", "ci": "Severe respiratory depression, acute narrow-angle glaucoma, myasthenia gravis"},

    # --- 9. Vitamins and Minerals ---
    {"name": "ferrous sulfate", "display": "Ferrous sulfate", "atc": "B03AA07", "class": "Oral Iron Preparation", "form": "TABLET", "strength": "200mg (65mg Fe)", "route": "ORAL", "sched": "1 tab OD/BD on empty stomach or with citrus juice", "preg": "A", "ci": "Hemochromatosis, hemosiderosis, hemolytic anemia"},
    {"name": "folic acid", "display": "Folic acid", "atc": "B03BB01", "class": "Water-Soluble B-Complex Vitamin", "form": "TABLET", "strength": "5mg", "route": "ORAL", "sched": "1 tab OD post-meal", "preg": "A", "ci": "Undiagnosed megaloblastic anemia without B12 exclusion"},
    {"name": "cholecalciferol", "display": "Cholecalciferol (Vitamin D3)", "atc": "A11CC05", "class": "Fat-Soluble Secosteroid Vitamin", "form": "CAPSULE", "strength": "60,000 IU", "route": "ORAL", "sched": "1 cap once weekly with milk for 8 weeks", "preg": "A", "ci": "Hypercalcemia, hypervitaminosis D, metastatic renal calcinosis"},
    {"name": "ascorbic acid", "display": "Ascorbic acid (Vitamin C)", "atc": "A11GA01", "class": "Water-Soluble Antioxidant Vitamin", "form": "TABLET", "strength": "500mg", "route": "ORAL", "sched": "1 tab OD chewed after meals", "preg": "A", "ci": "Hyperoxaluria, renal calcium oxalate calculi"}
]

def query_rxnav_live(query_name: str) -> Tuple[Optional[str], Optional[str], Optional[str]]:
    """
    Queries live NIH RxNav REST API:
    1. https://rxnav.nlm.nih.gov/REST/rxcui.json?name={name} -> fetches RxCUI
    2. https://rxnav.nlm.nih.gov/REST/rxclass/class/byRxcui.json?rxcui={rxcui}&relaSource=ATC -> fetches WHO ATC code
    """
    rxcui = None
    atc_code = None
    atc_class_name = None

    try:
        clean_name = query_name.split('/')[0].strip()
        url = f"https://rxnav.nlm.nih.gov/REST/rxcui.json?name={urllib.parse.quote(clean_name)}"
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 (ClinicalOS/1.0)"})
        with urllib.request.urlopen(req, timeout=6) as resp:
            data = json.loads(resp.read().decode())
            rxcuis = data.get("idGroup", {}).get("rxnormId", [])
            if rxcuis:
                rxcui = rxcuis[0]

        if rxcui:
            atc_url = f"https://rxnav.nlm.nih.gov/REST/rxclass/class/byRxcui.json?rxcui={rxcui}&relaSource=ATC"
            req_atc = urllib.request.Request(atc_url, headers={"User-Agent": "Mozilla/5.0 (ClinicalOS/1.0)"})
            with urllib.request.urlopen(req_atc, timeout=6) as resp2:
                data2 = json.loads(resp2.read().decode())
                items = data2.get("rxclassDrugInfoList", {}).get("rxclassDrugInfo", [])
                for it in items:
                    c = it.get("rxclassMinConceptItem", {})
                    if c.get("classId"):
                        atc_code = c.get("classId")
                        atc_class_name = c.get("className")
                        break
    except Exception:
        pass

    return rxcui, atc_code, atc_class_name


def setup_and_seed_standard_drugs(force_reseed: bool = True):
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            # 1. Ensure Table Schemas Exist
            cur.execute("""
            CREATE TABLE IF NOT EXISTS standard_generic_drugs (
                id INT AUTO_INCREMENT PRIMARY KEY,
                rxcui VARCHAR(32) NULL,
                atc_code VARCHAR(16) NOT NULL,
                inn_name VARCHAR(128) NOT NULL,
                therapeutic_class VARCHAR(128) NOT NULL,
                dosage_form VARCHAR(32) NOT NULL,
                strength VARCHAR(32) NOT NULL,
                route VARCHAR(32) DEFAULT 'ORAL',
                standard_schedule VARCHAR(128) NOT NULL,
                pregnancy_category ENUM('A', 'B', 'C', 'D', 'X') DEFAULT 'C',
                contraindication_summary TEXT NULL,
                is_essential_medicine TINYINT(1) DEFAULT 1,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_inn_name (inn_name),
                INDEX idx_atc_code (atc_code),
                INDEX idx_therapeutic_class (therapeutic_class)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
            """)

            cur.execute("""
            CREATE TABLE IF NOT EXISTS clinical_disease_indications (
                id INT AUTO_INCREMENT PRIMARY KEY,
                disease_code VARCHAR(64) NOT NULL,
                icd10_code VARCHAR(16) NOT NULL,
                disease_name VARCHAR(128) NOT NULL,
                generic_drug_id INT NOT NULL,
                line_of_treatment ENUM('FIRST_LINE', 'SECOND_LINE', 'ADJUNCT', 'SYMPTOMATIC') DEFAULT 'FIRST_LINE',
                allergy_trigger_class VARCHAR(64) NULL,
                organ_risk_flags VARCHAR(128) NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT fk_cdi_generic_drug FOREIGN KEY (generic_drug_id) REFERENCES standard_generic_drugs(id) ON DELETE CASCADE,
                INDEX idx_cdi_lookup (disease_code, icd10_code)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
            """)

            cur.execute("""
            CREATE TABLE IF NOT EXISTS brand_trade_products (
                id INT AUTO_INCREMENT PRIMARY KEY,
                generic_drug_id INT NOT NULL,
                brand_name VARCHAR(128) NOT NULL,
                manufacturer VARCHAR(128) NULL,
                price_inr DECIMAL(8, 2) DEFAULT 0.00,
                is_in_stock TINYINT(1) DEFAULT 1,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT fk_btp_generic_drug FOREIGN KEY (generic_drug_id) REFERENCES standard_generic_drugs(id) ON DELETE CASCADE,
                INDEX idx_btp_brand (brand_name)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
            """)

            if not force_reseed:
                cur.execute("SELECT COUNT(*) AS cnt FROM standard_generic_drugs;")
                row = cur.fetchone()
                if row and row['cnt'] >= len(WHO_EML_CATALOG):
                    print(f"standard_generic_drugs already contains {row['cnt']} records. Skipping.")
                    return

            print("Enriching WHO Model List of Essential Medicines via live NIH RxNav REST API...")

            # Query RxNav in parallel for all distinct WHO drug names
            unique_names = list({d["name"] for d in WHO_EML_CATALOG})
            rxnav_results = {}

            with ThreadPoolExecutor(max_workers=8) as pool:
                future_map = {pool.submit(query_rxnav_live, name): name for name in unique_names}
                for f in future_map:
                    name = future_map[f]
                    rxcui, atc_code, atc_class = f.result()
                    rxnav_results[name] = {"rxcui": rxcui, "atc_code": atc_code, "class_name": atc_class}

            enriched_count = sum(1 for v in rxnav_results.values() if v["rxcui"] is not None)
            print(f"NIH RxNav API successfully resolved {enriched_count}/{len(unique_names)} unique WHO molecules.")

            # Clear previous records cleanly
            cur.execute("SET FOREIGN_KEY_CHECKS = 0;")
            cur.execute("TRUNCATE TABLE brand_trade_products;")
            cur.execute("TRUNCATE TABLE clinical_disease_indications;")
            cur.execute("TRUNCATE TABLE standard_generic_drugs;")
            cur.execute("SET FOREIGN_KEY_CHECKS = 1;")

            # Insert Enriched WHO EML records into standard_generic_drugs
            insert_rows = []
            for item in WHO_EML_CATALOG:
                rx_data = rxnav_results.get(item["name"], {})
                resolved_rxcui = rx_data.get("rxcui")
                # Prefer live RxNav ATC code if available, else canonical WHO ATC
                resolved_atc = rx_data.get("atc_code") or item["atc"]
                resolved_class = rx_data.get("class_name") or item["class"]

                insert_rows.append((
                    resolved_rxcui,
                    resolved_atc,
                    item["display"],
                    resolved_class,
                    item["form"],
                    item["strength"],
                    item["route"],
                    item["sched"],
                    item["preg"],
                    item["ci"],
                    1
                ))

            cur.executemany("""
                INSERT INTO standard_generic_drugs (
                    rxcui, atc_code, inn_name, therapeutic_class, dosage_form, 
                    strength, route, standard_schedule, pregnancy_category, contraindication_summary, is_essential_medicine
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s);
            """, insert_rows)

            print(f"Successfully populated {cur.rowcount} standard WHO EML generic medicines into standard_generic_drugs.")

            # Build in-memory map of (inn_name, strength) -> id
            cur.execute("SELECT id, inn_name, strength FROM standard_generic_drugs;")
            drug_id_map = {(r["inn_name"], r["strength"]): r["id"] for r in cur.fetchall()}

            def gid(inn, strength):
                return drug_id_map.get((inn, strength))

            # Populate ICD-10 Disease Indication Mappings
            indications = [
                # Essential (Primary) Hypertension (I10)
                ('HYPERTENSION_STAGE2', 'I10', 'Essential (Primary) Hypertension', gid('Amlodipine', '5mg'), 'FIRST_LINE', 'CCB', 'SEVERE_HYPOTENSION'),
                ('HYPERTENSION_STAGE2', 'I10', 'Essential (Primary) Hypertension', gid('Telmisartan', '40mg'), 'FIRST_LINE', 'ARB', 'PREGNANCY,RENAL_ARTERY_STENOSIS'),
                ('HYPERTENSION_STAGE2', 'I10', 'Essential (Primary) Hypertension', gid('Enalapril', '5mg'), 'FIRST_LINE', 'ACE_INHIBITOR', 'ANGIOEDEMA,PREGNANCY'),
                ('HYPERTENSION_STAGE2', 'I10', 'Essential (Primary) Hypertension', gid('Losartan', '50mg'), 'FIRST_LINE', 'ARB', 'PREGNANCY'),
                ('HYPERTENSION_STAGE2', 'I10', 'Essential (Primary) Hypertension', gid('Hydrochlorothiazide', '12.5mg'), 'FIRST_LINE', 'THIAZIDE', 'ANURIA,HYPOKALEMIA'),
                ('HYPERTENSION_STAGE2', 'I10', 'Essential (Primary) Hypertension', gid('Atenolol', '50mg'), 'SECOND_LINE', 'BETA_BLOCKER', 'ASTHMA,BRADYCARDIA'),
                ('HYPERTENSION_STAGE2', 'I10', 'Essential (Primary) Hypertension', gid('Bisoprolol', '2.5mg'), 'SECOND_LINE', 'BETA_BLOCKER', 'ACUTE_HEART_FAILURE'),

                # Acute Upper Respiratory Tract Infection (J06.9)
                ('ACUTE_RESPIRATORY_URI', 'J06.9', 'Acute Upper Respiratory Tract Infection', gid('Amoxicillin + Clavulanic acid', '625mg'), 'FIRST_LINE', 'PENICILLIN', 'HEPATIC_IMPAIRMENT'),
                ('ACUTE_RESPIRATORY_URI', 'J06.9', 'Acute Upper Respiratory Tract Infection', gid('Azithromycin', '500mg'), 'SECOND_LINE', 'MACROLIDE', 'QT_PROLONGATION'),
                ('ACUTE_RESPIRATORY_URI', 'J06.9', 'Acute Upper Respiratory Tract Infection', gid('Paracetamol', '650mg'), 'SYMPTOMATIC', 'PARACETAMOL', 'HEPATIC_FAILURE'),
                ('ACUTE_RESPIRATORY_URI', 'J06.9', 'Acute Upper Respiratory Tract Infection', gid('Cetirizine', '10mg'), 'SYMPTOMATIC', 'ANTIHISTAMINE', 'RENAL_FAILURE'),

                # Acute Febrile Illness / Pyrexia (R50.9)
                ('ACUTE_FEVER_PYREXIA', 'R50.9', 'Fever / Pyrexia of Unknown Origin', gid('Paracetamol', '650mg'), 'FIRST_LINE', 'PARACETAMOL', 'HEPATIC_FAILURE'),
                ('ACUTE_FEVER_PYREXIA', 'R50.9', 'Fever / Pyrexia of Unknown Origin', gid('Paracetamol', '120mg/5ml'), 'FIRST_LINE', 'PARACETAMOL', 'HEPATIC_FAILURE'),
                ('ACUTE_FEVER_PYREXIA', 'R50.9', 'Fever / Pyrexia of Unknown Origin', gid('Ibuprofen', '400mg'), 'SECOND_LINE', 'NSAID', 'PEPTIC_ULCER,CKD'),

                # Type 2 Diabetes Mellitus (E11.9)
                ('TYPE2_DIABETES', 'E11.9', 'Type 2 Diabetes Mellitus', gid('Metformin', '500mg'), 'FIRST_LINE', 'BIGUANIDE', 'RENAL_EGFR_LESS_30'),
                ('TYPE2_DIABETES', 'E11.9', 'Type 2 Diabetes Mellitus', gid('Glimepiride', '2mg'), 'SECOND_LINE', 'SULFA', 'HYPOGLYCEMIA_RISK'),
                ('TYPE2_DIABETES', 'E11.9', 'Type 2 Diabetes Mellitus', gid('Insulin (Human Regular)', '100 IU/ml'), 'SECOND_LINE', 'INSULIN', 'HYPOGLYCEMIA'),

                # Primary Hyperlipidemia (E78.0)
                ('HYPERLIPIDEMIA', 'E78.0', 'Primary Hypercholesterolemia', gid('Atorvastatin', '10mg'), 'FIRST_LINE', 'STATIN', 'ACTIVE_LIVER_DISEASE,PREGNANCY'),
                ('HYPERLIPIDEMIA', 'E78.0', 'Primary Hypercholesterolemia', gid('Atorvastatin', '20mg'), 'FIRST_LINE', 'STATIN', 'ACTIVE_LIVER_DISEASE,PREGNANCY'),

                # Primary Hypothyroidism (E03.9)
                ('HYPOTHYROIDISM', 'E03.9', 'Primary Hypothyroidism', gid('Levothyroxine', '50mcg'), 'FIRST_LINE', 'THYROID_HORMONE', 'ACUTE_MI'),

                # Gastroesophageal Reflux Disease & Peptic Dyspepsia (K21.9 / K29.7)
                ('GERD_ACUTE_GASTRITIS', 'K21.9', 'Gastroesophageal Reflux Disease and Dyspepsia', gid('Pantoprazole', '40mg'), 'FIRST_LINE', 'PPI', 'HYPOMAGNESEMIA'),
                ('GERD_ACUTE_GASTRITIS', 'K21.9', 'Gastroesophageal Reflux Disease and Dyspepsia', gid('Omeprazole', '20mg'), 'FIRST_LINE', 'PPI', 'RILPIVIRINE_INTERACTION'),
                ('GERD_ACUTE_GASTRITIS', 'K21.9', 'Gastroesophageal Reflux Disease and Dyspepsia', gid('Ondansetron', '4mg'), 'SYMPTOMATIC', 'SEROTONIN_ANTAG', 'LONG_QT_SYNDROME'),

                # Acute Gastroenteritis / Diarrhea (A09)
                ('ACUTE_GASTROENTERITIS', 'A09', 'Infectious Gastroenteritis and Colitis', gid('Oral Rehydration Salts (WHO-ORS)', '20.5g/L'), 'FIRST_LINE', 'ELECTROLYTE', 'INTRACTABLE_VOMITING'),
                ('ACUTE_GASTROENTERITIS', 'A09', 'Infectious Gastroenteritis and Colitis', gid('Zinc sulfate', '20mg'), 'FIRST_LINE', 'MINERAL', 'COPPER_DEFICIENCY'),
                ('ACUTE_GASTROENTERITIS', 'A09', 'Infectious Gastroenteritis and Colitis', gid('Loperamide', '2mg'), 'SYMPTOMATIC', 'OPIOID_DERIVATIVE', 'BLOODY_DYSENTERY'),

                # Bronchial Asthma / COPD Airway Obstruction (J45.9)
                ('BRONCHIAL_ASTHMA', 'J45.9', 'Bronchial Asthma and Chronic Airway Obstruction', gid('Salbutamol', '100mcg/puff'), 'FIRST_LINE', 'SABA_BRONCHODILATOR', 'TACHYARRHYTHMIA'),
                ('BRONCHIAL_ASTHMA', 'J45.9', 'Bronchial Asthma and Chronic Airway Obstruction', gid('Budesonide', '200mcg/puff'), 'FIRST_LINE', 'INHALED_STEROID', 'STATUS_ASTHMATICUS'),
                ('BRONCHIAL_ASTHMA', 'J45.9', 'Bronchial Asthma and Chronic Airway Obstruction', gid('Ipratropium bromide', '20mcg/puff'), 'ADJUNCT', 'ANTICHOLINERGIC', 'GLAUCOMA'),
                ('BRONCHIAL_ASTHMA', 'J45.9', 'Bronchial Asthma and Chronic Airway Obstruction', gid('Montelukast', '10mg'), 'ADJUNCT', 'LEUKOTRIENE_ANTAG', 'ACUTE_ASTHMA_RESCUE'),

                # Allergic Rhinitis & Urticaria (J30.9 / L50.9)
                ('ALLERGIC_RHINITIS', 'J30.9', 'Allergic Rhinitis and Urticaria', gid('Cetirizine', '10mg'), 'FIRST_LINE', 'ANTIHISTAMINE', 'END_STAGE_RENAL'),
                ('ALLERGIC_RHINITIS', 'J30.9', 'Allergic Rhinitis and Urticaria', gid('Loratadine', '10mg'), 'FIRST_LINE', 'ANTIHISTAMINE', 'SEVERE_HEPATIC_IMPAIRMENT'),

                # Acute Musculoskeletal Pain & Arthritis (M79.1 / M19.9)
                ('ACUTE_MUSCULOSKELETAL_PAIN', 'M79.1', 'Myalgia and Musculoskeletal Arthralgia', gid('Paracetamol', '650mg'), 'FIRST_LINE', 'PARACETAMOL', 'HEPATIC_FAILURE'),
                ('ACUTE_MUSCULOSKELETAL_PAIN', 'M79.1', 'Myalgia and Musculoskeletal Arthralgia', gid('Ibuprofen', '400mg'), 'FIRST_LINE', 'NSAID', 'PEPTIC_ULCER,CKD'),
                ('ACUTE_MUSCULOSKELETAL_PAIN', 'M79.1', 'Myalgia and Musculoskeletal Arthralgia', gid('Tramadol', '50mg'), 'SECOND_LINE', 'OPIOID', 'RESP_DEPRESSION'),

                # Major Depression / Anxiety (F32.9 / F41.1)
                ('MAJOR_DEPRESSION_SCREEN', 'F32.9', 'Major Depressive Episode', gid('Escitalopram', '10mg'), 'FIRST_LINE', 'SSRI', 'MAOI_USE,QT_PROLONGATION'),
                ('MAJOR_DEPRESSION_SCREEN', 'F32.9', 'Major Depressive Episode', gid('Sertraline', '50mg'), 'FIRST_LINE', 'SSRI', 'MAOI_USE'),
                ('MAJOR_DEPRESSION_SCREEN', 'F32.9', 'Major Depressive Episode', gid('Fluoxetine', '20mg'), 'FIRST_LINE', 'SSRI', 'MAOI_USE'),
                ('ANXIETY_DISORDER', 'F41.1', 'Generalized Anxiety Disorder', gid('Escitalopram', '10mg'), 'FIRST_LINE', 'SSRI', 'MAOI_USE'),
                ('ANXIETY_DISORDER', 'F41.1', 'Generalized Anxiety Disorder', gid('Lorazepam', '1mg'), 'SECOND_LINE', 'BENZODIAZEPINE', 'RESP_DEPRESSION')
            ]

            valid_indications = [ind for ind in indications if ind[3] is not None]
            cur.executemany("""
                INSERT INTO clinical_disease_indications (
                    disease_code, icd10_code, disease_name, generic_drug_id, 
                    line_of_treatment, allergy_trigger_class, organ_risk_flags
                ) VALUES (%s, %s, %s, %s, %s, %s, %s);
            """, valid_indications)

            print(f"Successfully mapped {len(valid_indications)} clinical disease indications.")

            # Populate Brand Trade Product Aliases
            brands = [
                (gid('Amlodipine', '5mg'), 'Amlokind 5', 'Mankind Pharma', 18.50),
                (gid('Amlodipine', '5mg'), 'Norvasc 5', 'Pfizer', 45.00),
                (gid('Amlodipine', '5mg'), 'Stamlo 5', "Dr. Reddy's Laboratories", 34.00),
                (gid('Amlodipine', '10mg'), 'Amlokind 10', 'Mankind Pharma', 28.00),
                (gid('Telmisartan', '40mg'), 'Telma 40', 'Glenmark Pharmaceuticals', 88.00),
                (gid('Telmisartan', '40mg'), 'Micardis 40', 'Boehringer Ingelheim', 120.00),
                (gid('Losartan', '50mg'), 'Losacar 50', 'Zydus Cadila', 72.00),
                (gid('Losartan', '50mg'), 'Cozaar 50', 'Organon / Merck', 110.00),
                (gid('Paracetamol', '650mg'), 'Dolo 650', 'Micro Labs', 32.00),
                (gid('Paracetamol', '650mg'), 'Calpol 650', 'GSK Consumer', 30.50),
                (gid('Paracetamol', '650mg'), 'Crocin 650', 'GSK', 33.00),
                (gid('Paracetamol', '120mg/5ml'), 'Calpol Pediatric Suspension', 'GSK', 42.00),
                (gid('Paracetamol', '500mg'), 'Tylenol 500', 'Kenvue / Johnson & Johnson', 45.00),
                (gid('Amoxicillin + Clavulanic acid', '625mg'), 'Augmentin 625 Duo', 'GlaxoSmithKline (GSK)', 205.00),
                (gid('Amoxicillin + Clavulanic acid', '625mg'), 'Moxikind-CV 625', 'Mankind Pharma', 165.00),
                (gid('Amoxicillin + Clavulanic acid', '625mg'), 'Clavam 625', 'Alkem Laboratories', 180.00),
                (gid('Azithromycin', '500mg'), 'Azithral 500', 'Alembic Pharmaceuticals', 118.00),
                (gid('Azithromycin', '500mg'), 'Zithromax 500', 'Pfizer', 140.00),
                (gid('Cefixime', '200mg'), 'Taxim-O 200', 'Alkem Laboratories', 105.00),
                (gid('Ciprofloxacin', '500mg'), 'Ciplox 500', 'Cipla', 42.00),
                (gid('Metformin', '500mg'), 'Glycomet 500', 'USV Private Limited', 24.00),
                (gid('Metformin', '500mg'), 'Glucophage 500', 'Merck Serono', 35.00),
                (gid('Pantoprazole', '40mg'), 'Pan 40', 'Alkem Laboratories', 85.00),
                (gid('Pantoprazole', '40mg'), 'Pantocid 40', 'Sun Pharma', 92.00),
                (gid('Omeprazole', '20mg'), 'Omez 20', "Dr. Reddy's Laboratories", 55.00),
                (gid('Salbutamol', '100mcg/puff'), 'Asthalin Inhaler', 'Cipla', 160.00),
                (gid('Salbutamol', '100mcg/puff'), 'Ventolin Evohaler', 'GlaxoSmithKline (GSK)', 185.00),
                (gid('Budesonide', '200mcg/puff'), 'Budecort 200 Inhaler', 'Cipla', 310.00),
                (gid('Budesonide', '200mcg/puff'), 'Pulmicort Turbuhaler', 'AstraZeneca', 450.00),
                (gid('Cetirizine', '10mg'), 'Cetzine 10', "Dr. Reddy's Laboratories", 22.00),
                (gid('Cetirizine', '10mg'), 'Zyrtec 10', 'Johnson & Johnson', 38.00),
                (gid('Montelukast', '10mg'), 'Montair 10', 'Cipla', 145.00),
                (gid('Escitalopram', '10mg'), 'Nexito 10', 'Sun Pharma', 98.00),
                (gid('Escitalopram', '10mg'), 'Lexapro 10', 'Allergan / AbbVie', 180.00),
                (gid('Sertraline', '50mg'), 'Sertima 50', 'Intas Pharmaceuticals', 115.00),
                (gid('Sertraline', '50mg'), 'Zoloft 50', 'Pfizer', 190.00)
            ]

            valid_brands = [b for b in brands if b[0] is not None]
            cur.executemany("""
                INSERT INTO brand_trade_products (generic_drug_id, brand_name, manufacturer, price_inr, is_in_stock)
                VALUES (%s, %s, %s, %s, 1);
            """, valid_brands)

            print(f"Successfully linked {len(valid_brands)} commercial trade brand aliases.")

    finally:
        conn.close()

if __name__ == "__main__":
    setup_and_seed_standard_drugs(force_reseed=True)
