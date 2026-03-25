const cards = [
  {
    question: "What does the P wave on an ECG represent, and what are its normal characteristics in lead II?",
    answer: "The P wave represents atrial contraction. In lead II, it should be rounded, <120 msec in duration, and <2.5 mm in height.",
    explanation: "Normal atrial depolarization produces a smooth, rounded P wave. Abnormal P wave morphology can indicate atrial enlargement or arrhythmia.",
    difficulty: 1,
    bloomLevel: "recall",
    tags: ["ECG", "P wave", "atrial"]
  },
  {
    question: "What does a biphasic P wave with a positive phase followed by a negative phase in lead V1 indicate?",
    answer: "This is the normal appearance of the P wave in lead V1.",
    explanation: "In lead V1, the normal P wave is biphasic because atrial depolarization moves away from this right-sided lead during its terminal portion.",
    difficulty: 1,
    bloomLevel: "recall",
    tags: ["ECG", "P wave", "lead V1"]
  },
  {
    question: "What does a sawtooth P wave with continuous atrial activity at approximately 300 bpm indicate on ECG?",
    answer: "Atrial flutter (AFL).",
    explanation: "The classic atrial flutter pattern shows rapid, regular atrial activity at approximately 300 bpm creating a characteristic sawtooth appearance. Flip the ECG upside-down and check inferior leads (II, III, aVF) to visualize it better.",
    difficulty: 2,
    bloomLevel: "recall",
    tags: ["ECG", "atrial flutter", "arrhythmia"]
  },
  {
    question: "What are the ECG findings in atrial fibrillation (AFib)?",
    answer: "Absent P waves, may have fibrillatory wave, and an irregularly irregular ventricular rhythm.",
    explanation: "Loss of coordinated atrial activity in AFib eliminates discrete P waves, replacing them with fibrillatory baseline artifacts. The ventricular response is characteristically irregularly irregular.",
    difficulty: 2,
    bloomLevel: "recall",
    tags: ["ECG", "atrial fibrillation", "arrhythmia"]
  },
  {
    question: "What ECG findings suggest right atrial enlargement (RAE)?",
    answer: "Tall P wave (>2.5 mm) in lead II or V1, known as P pulmonale.",
    explanation: "Right atrial enlargement increases P wave amplitude because the enlarged atrium generates a larger electrical signal.",
    difficulty: 2,
    bloomLevel: "recall",
    tags: ["ECG", "RAE", "P pulmonale", "atrial enlargement"]
  },
  {
    question: "What ECG findings suggest left atrial enlargement (LAE)?",
    answer: "Biphasic P wave with negative deflection >1 mm deep or >1 mm wide in V1; wide (>100 msec) notched P wave in lead II (P mitrale).",
    explanation: "Left atrial enlargement prolongs atrial depolarization and changes the P wave vector, producing characteristic notching in lead II and biphasic morphology with terminal negativity in V1.",
    difficulty: 2,
    bloomLevel: "apply",
    tags: ["ECG", "LAE", "P mitrale", "atrial enlargement"]
  },
  {
    question: "What is dromotropy in the context of the P-R interval and ECG?",
    answer: "Dromotropy refers to the conduction velocity through the AV node and His-Purkinje system. Positive dromotropy = faster conduction; negative dromotropy = slower conduction.",
    explanation: "The P-R interval reflects conduction time through the atria, AV node, and bundle of His. Sympathetic stimulation increases conduction velocity (positive dromotropy); vagal stimulation decreases it (negative dromotropy).",
    difficulty: 2,
    bloomLevel: "recall",
    tags: ["ECG", "P-R interval", "dromotropy", "conduction"]
  },
  {
    question: "What is the normal P-R interval on ECG?",
    answer: "120-200 msec.",
    explanation: "The P-R interval represents the time from sinus node activation to the start of ventricular depolarization and should fall within this range.",
    difficulty: 1,
    bloomLevel: "recall",
    tags: ["ECG", "P-R interval"]
  },
  {
    question: "What does a prolonged P-R interval (>200 msec) on ECG indicate?",
    answer: "AV conduction delay or heart block, which may be caused by disease, AV node delay, distal (His-Purkinje) conduction system disease, medications, or high vagal tone.",
    explanation: "A prolonged P-R interval indicates slowed impulse conduction somewhere in the system between the sinus node and ventricular myocardium.",
    difficulty: 2,
    bloomLevel: "apply",
    tags: ["ECG", "P-R interval", "AV block", "conduction"]
  },
  {
    question: "What characterizes first-degree AV block on ECG?",
    answer: "Fixed, prolonged P-R interval (>200 msec), but every P wave is followed by a QRS complex.",
    explanation: "First-degree AV block represents slowed but intact AV conduction; all atrial impulses eventually conduct to the ventricles.",
    difficulty: 2,
    bloomLevel: "recall",
    tags: ["ECG", "first-degree AV block", "P-R interval"]
  },
  {
    question: "What is the ECG hallmark of second-degree Mobitz I (Wenckebach) AV block?",
    answer: "Gradual prolongation of the P-R interval preceding a dropped QRS complex (non-conducted P wave).",
    explanation: "Mobitz I block involves progressive delay in AV nodal conduction until a beat fails to conduct, creating a characteristic pattern of changing P-R intervals before the dropped beat.",
    difficulty: 3,
    bloomLevel: "apply",
    tags: ["ECG", "Wenckebach", "Mobitz I", "AV block"]
  },
  {
    question: "What is the ECG hallmark of second-degree Mobitz II (Hay) AV block?",
    answer: "Fixed P-R interval with a regular pattern of atrial beats followed by dropped ventricular beats (e.g., 3:1 block = 3 atrial beats for every 1 ventricular beat).",
    explanation: "Mobitz II block involves failure of conduction in the distal His-Purkinje system. The P-R interval remains constant unlike in Wenckebach, but some P waves fail to conduct to ventricles.",
    difficulty: 3,
    bloomLevel: "apply",
    tags: ["ECG", "Mobitz II", "Hay", "AV block"]
  },
  {
    question: "What characterizes third-degree (complete) AV block on ECG?",
    answer: "Constant P-P and R-R intervals but variable P-R intervals; P waves and QRS complexes are completely dissociated.",
    explanation: "In complete heart block, the atria and ventricles beat independently because conduction through the AV node is completely interrupted. Atrial rate and ventricular rate are each regular but unrelated.",
    difficulty: 3,
    bloomLevel: "apply",
    tags: ["ECG", "third-degree AV block", "complete heart block"]
  },
  {
    question: "What is a trifascicular block in ECG interpretation?",
    answer: "A long PR segment (first-degree AV block) combined with bifascicular block.",
    explanation: "Trifascicular block involves impairment of conduction through two of the three fascicles of the His-Purkinje system, plus some degree of AV nodal delay, increasing risk of progression to complete heart block.",
    difficulty: 4,
    bloomLevel: "analyze",
    tags: ["ECG", "trifascicular block", "conduction system"]
  },
  {
    question: "What does a short P-R interval (<120 msec) on ECG suggest?",
    answer: "Pre-excitation syndrome (e.g., WPW with delta wave) or low atrial rhythm (with inverted P waves in II, III, and aVF).",
    explanation: "A short P-R interval indicates that ventricular depolarization begins earlier than normal, typically due to an accessory pathway bypassing the AV node, or an ectopic atrial focus.",
    difficulty: 3,
    bloomLevel: "apply",
    tags: ["ECG", "P-R interval", "WPW", "pre-excitation"]
  },
  {
    question: "What does the QRS complex represent on ECG?",
    answer: "Ventricular contraction (depolarization of the ventricles).",
    explanation: "The QRS complex reflects rapid depolarization of the ventricular myocardium through the His-Purkinje conduction system.",
    difficulty: 1,
    bloomLevel: "recall",
    tags: ["ECG", "QRS complex", "ventricular"]
  },
  {
    question: "What does a narrow QRS complex (<120 msec) indicate about ventricular depolarization?",
    answer: "The His-Purkinje system is being used for ventricular depolarization (normal conduction pathway).",
    explanation: "A narrow QRS indicates that conduction is traveling through the specialized His-Purkinje system, which rapidly distributes the impulse throughout the ventricles.",
    difficulty: 2,
    bloomLevel: "apply",
    tags: ["ECG", "QRS complex", "conduction", "narrow QRS"]
  },
  {
    question: "What causes a wide QRS complex (>120 msec) on ECG?",
    answer: "The His-Purkinje system is bypassed or diseased. Causes include: BBB, VT, ventricular hypertrophy, cardiomyopathy, WPW, ectopic ventricular beat, hyperkalemia, or drugs (tricyclic antidepressants, antiarrhythmics).",
    explanation: "Wide QRS complexes indicate slower ventricular depolarization, occurring when the impulse must spread through myocardial cells rather than the rapid Purkinje network.",
    difficulty: 3,
    bloomLevel: "apply",
    tags: ["ECG", "QRS complex", "wide QRS", "BBB", "hyperkalemia"]
  },
  {
    question: "When is a Q wave on ECG considered pathologically significant?",
    answer: "A Q wave is significant (indicating myocardial necrosis) if it is >40 msec wide OR >1/3 of the total QRS amplitude.",
    explanation: "Pathological Q waves indicate prior myocardial infarction when they represent absent electrical activity in necrotic myocardium. Small Q waves in inferior and lateral leads can be normal.",
    difficulty: 3,
    bloomLevel: "apply",
    tags: ["ECG", "Q wave", "myocardial infarction", "necrosis"]
  },
  {
    question: "What do R and S wave abnormalities on ECG typically indicate?",
    answer: "Bundle branch block (BBB) or intraventricular conduction abnormalities.",
    explanation: "Abnormal R and S wave progression reflects disrupted ventricular depolarization patterns, most commonly from conduction blocks in the bundle branches.",
    difficulty: 3,
    bloomLevel: "apply",
    tags: ["ECG", "R wave", "S wave", "BBB", "conduction"]
  },
  {
    question: "Where is the ST segment located on ECG, and what does it normally look like?",
    answer: "The ST segment is located between the QRS complex and the beginning of the T wave. It corresponds to the completion of ventricular depolarization and should normally be at the same level as the baseline (T-P segment).",
    explanation: "The ST segment represents the period when ventricular myocardium is fully depolarized. Elevation or depression from baseline indicates ischemia or injury.",
    difficulty: 2,
    bloomLevel: "recall",
    tags: ["ECG", "ST segment"]
  },
  {
    question: "What does ST depression on ECG indicate, and what is its clinical significance?",
    answer: "ST depression indicates ischemia and can result in NSTEMI. However, lateral ST depression (leads I, aVL, V5, V6) may actually indicate a STEMI in the right ventricle.",
    explanation: "ST depression reflects subendocardial ischemia. The caveat about lateral depression indicating right-sided STEMI is clinically critical; missing a right ventricular infarction changes management significantly.",
    difficulty: 4,
    bloomLevel: "analyze",
    tags: ["ECG", "ST depression", "ischemia", "NSTEMI"]
  },
  {
    question: "What causes nonspecific ST depression on ECG?",
    answer: "Nonspecific ST depression may be associated with remote MI or ischemia, or may have no clinical significance.",
    explanation: "Not all ST segment changes indicate acute coronary syndrome. Clinical correlation with symptoms, biomarkers, and serial ECGs is essential.",
    difficulty: 3,
    bloomLevel: "analyze",
    tags: ["ECG", "ST depression", "nonspecific"]
  },
  {
    question: "What does the T wave on ECG represent?",
    answer: "Repolarization of the ventricles (repolarization of the atria is obscured by the QRS complex).",
    explanation: "The T wave reflects recovery of ventricular myocardium. Unlike the QRS, T wave changes are more subtle and influenced by many factors.",
    difficulty: 1,
    bloomLevel: "recall",
    tags: ["ECG", "T wave", "repolarization"]
  },
  {
    question: "In which leads is the T wave normally negative?",
    answer: "Lead aVR and lead V1 (though normal isolated negative T waves may also be present in V1 and V2).",
    explanation: "Due to the vector of ventricular repolarization, T waves are normally inverted in aVR. Negative T waves in V1 can be a normal variant, especially if isolated.",
    difficulty: 2,
    bloomLevel: "recall",
    tags: ["ECG", "T wave", "normal variant"]
  },
  {
    question: "What causes T wave inversion on ECG?",
    answer: "Bundle branch block (BBB), ischemia, hypertrophy, drugs (e.g., digitalis), or pulmonary embolism (lead III as part of S1Q3T3 sign).",
    explanation: "T wave inversion reflects altered ventricular repolarization from various causes including ischemia, structural heart disease, and medication effects.",
    difficulty: 3,
    bloomLevel: "apply",
    tags: ["ECG", "T wave inversion", "ischemia", "BBB"]
  },
  {
    question: "What causes T wave elevation on ECG?",
    answer: "Infarction (STEMI, Prinzmetal/variant angina, hyperacute phase), or hyperkalemia (wider, peaked T waves).",
    explanation: "Hyperacute T waves precede ST elevation in STEMI. Peaked T waves from hyperkalemia represent a medical emergency requiring immediate treatment.",
    difficulty: 3,
    bloomLevel: "apply",
    tags: ["ECG", "T wave elevation", "hyperkalemia", "STEMI"]
  },
  {
    question: "What causes flattened T waves on ECG?",
    answer: "Hypokalemia, pericarditis, drugs (e.g., digitalis), or pericardial effusion. Flat T waves are often nonspecific with no clinical significance.",
    explanation: "While many conditions can flatten T waves, the most common cause is benign and nonspecific. Clinical context determines significance.",
    difficulty: 3,
    bloomLevel: "apply",
    tags: ["ECG", "T wave", "hypokalemia", "pericarditis"]
  },
  {
    question: "What is T wave alternans and what is its clinical significance?",
    answer: "T wave alternans refers to beat-to-beat variations in T wave morphology. It can be caused by PVC overlap (R-on-T phenomenon), which may precipitate VT or VFib.",
    explanation: "T wave alternans reflects electrical instability at the myocardial level. R-on-T phenomenon is particularly dangerous as it can trigger lethal ventricular arrhythmias.",
    difficulty: 4,
    bloomLevel: "analyze",
    tags: ["ECG", "T wave alternans", "VT", "VFib", "PVC"]
  },
  {
    question: "What is appropriate T wave discordance in the context of bundle branch block?",
    answer: "In BBB, the T wave deflection should be opposite to the terminal QRS deflection (i.e., T wave negative if QRS ends with R or R prime, positive if QRS ends with S).",
    explanation: "Discordance between QRS and T wave vectors in BBB is expected due to abnormal depolarization causing abnormal repolarization. Concordant T waves with BBB suggest pathology.",
    difficulty: 4,
    bloomLevel: "analyze",
    tags: ["ECG", "T wave", "BBB", "discordance"]
  },
  {
    question: "What is the QT interval on ECG, and how is it corrected for heart rate?",
    answer: "The QT interval represents the duration of ventricular depolarization plus repolarization. The corrected QT (QTc) uses the Bazett formula: QTc = QT divided by the square root of the RR interval, though this is inaccurate at rapid heart rates (>100 bpm).",
    explanation: "The QT interval shortens with increasing heart rate. QTc normalizes for this rate dependence, allowing comparison across different heart rates.",
    difficulty: 3,
    bloomLevel: "apply",
    tags: ["ECG", "QT interval", "QTc", "Bazett"]
  },
  {
    question: "What are the normal QTc values for males and females?",
    answer: "Normal QTc is 360-450 msec for males and 360-460 msec for females.",
    explanation: "Females have slightly longer baseline QTc intervals than males, which is why the upper limit of normal differs by sex.",
    difficulty: 1,
    bloomLevel: "recall",
    tags: ["ECG", "QTc", "normal values"]
  },
  {
    question: "What conditions and medications are associated with prolonged QTc (>450 msec males, >460 msec females)?",
    answer: "Conditions: genetic long QT syndrome, hypothyroidism, hypothermia, cardiomyopathy. Medications: antiarrhythmics (classes I and III), antipsychotics (haloperidol, ziprasidone), antidepressants (citalopram), antibiotics (erythromycin, azithromycin). Electrolytes: low calcium, low potassium, low magnesium.",
    explanation: "Prolonged QTc increases the risk of Torsades de Pointes, a potentially lethal polymorphic ventricular tachycardia. Risk is rare if QTc is less than 520 msec.",
    difficulty: 4,
    bloomLevel: "analyze",
    tags: ["ECG", "QTc", "prolonged", "Torsades de Pointes"]
  },
  {
    question: "What causes a shortened QTc interval (<360 msec)?",
    answer: "Risk of VFib (very rare). Causes include hypercalcemia, drugs (digoxin), and hyperthyroidism.",
    explanation: "Short QT syndrome is a rare channelopathy associated with increased risk of atrial and ventricular arrhythmias including VFib.",
    difficulty: 3,
    bloomLevel: "apply",
    tags: ["ECG", "QTc", "short QT", "VFib"]
  },
  {
    question: "What is the U wave on ECG, and what is its normal appearance?",
    answer: "The U wave is a small deflection following the T wave with less than 25% of the T wave amplitude. Its origin may represent repolarization of Purkinje fibers or delayed myocardium. It is more visible at slower heart rates.",
    explanation: "U waves are normally subtle and most prominent in the precordial leads. Prominent or inverted U waves can signal electrolyte or cardiac abnormalities.",
    difficulty: 2,
    bloomLevel: "recall",
    tags: ["ECG", "U wave"]
  },
  {
    question: "What do prominent U waves (>25% of T wave amplitude) indicate?",
    answer: "Hypokalemia or drugs such as digoxin and antiarrhythmics.",
    explanation: "Low potassium prolongs ventricular repolarization and enhances the U wave. This finding should prompt electrolyte evaluation.",
    difficulty: 3,
    bloomLevel: "apply",
    tags: ["ECG", "U wave", "hypokalemia"]
  },
  {
    question: "What do inverted U waves on ECG indicate?",
    answer: "Ischemia or volume overload.",
    explanation: "U wave inversion is an uncommon but specific finding associated with myocardial ischemia and conditions causing volume overload of the ventricles.",
    difficulty: 3,
    bloomLevel: "apply",
    tags: ["ECG", "U wave", "ischemia", "volume overload"]
  },
  {
    question: "What is the differential diagnosis of ST segment elevation on ECG?",
    answer: "STEMI, early repolarization (normal variant), Prinzmetal (vasospastic) angina, ventricular aneurysm, and hypothermia (Osborne waves).",
    explanation: "Not all ST elevation indicates acute MI. Early repolarization is a normal variant, and vasospasm can cause transient elevation without necrosis.",
    difficulty: 4,
    bloomLevel: "analyze",
    tags: ["ECG", "ST elevation", "differential diagnosis", "STEMI"]
  },
  {
    question: "What does the WAR SHIP mnemonic stand for in ST depression differential diagnosis?",
    answer: "WAR SHIP: Wolff-Parkinson-White syndrome, Acute ischemia, RBBB, Strain (LVH or RVH), Hypokalemia, Incomplete RBBB, Posterior MI.",
    explanation: "This mnemonic helps systematically consider the causes of ST depression when interpreting ECGs, reminding clinicians of both benign and serious etiologies.",
    difficulty: 4,
    bloomLevel: "recall",
    tags: ["ECG", "ST depression", "mnemonic", "WAR SHIP"]
  },
  {
    question: "What is the peak time and duration of troponin elevation after myocardial infarction?",
    answer: "Troponin I and T peak at 12-24 hours and remain elevated for up to 2 weeks after MI.",
    explanation: "Troponin's prolonged elevation makes it useful for detecting recent MI even several days after the event, but it limits the ability to detect early reinfarction.",
    difficulty: 2,
    bloomLevel: "recall",
    tags: ["cardiac biomarkers", "troponin", "MI", "diagnosis"]
  },
  {
    question: "What conditions other than acute coronary syndrome can elevate troponin levels?",
    answer: "CHF, AFib, acute PE, aortic dissection, myocarditis, pericarditis, endocarditis, cardiac defibrillation, myocardial damage, infiltrative cardiomyopathy, ischemic stroke, intracranial hemorrhage, acute hypotension, chronic renal insufficiency, sepsis, ARDS, chronic hypertension, diabetes mellitus.",
    explanation: "Troponin elevation is sensitive but not specific for ACS. Clinical context is essential to distinguish cardiac injury from infarction.",
    difficulty: 4,
    bloomLevel: "analyze",
    tags: ["cardiac biomarkers", "troponin", "false positive", "differential"]
  },
  {
    question: "What are the key differences between troponin and CK-MB for cardiac injury evaluation?",
    answer: "Troponin is more cardiac-specific and remains elevated for up to 2 weeks. CK-MB rises earlier (4-6 hours), peaks at 24 hours, and returns to normal in 2-3 days, making it more useful for detecting early reinfarction.",
    explanation: "Troponin is the preferred marker for initial MI diagnosis due to superior sensitivity and specificity. CK-MB's shorter elevation window makes it valuable for detecting new infarctions occurring after the initial event.",
    difficulty: 3,
    bloomLevel: "apply",
    tags: ["cardiac biomarkers", "troponin", "CK-MB", "diagnosis"]
  },
  {
    question: "What does STEMI stand for, and why is it significant in the context of cardiac biomarkers?",
    answer: "STEMI = ST-Elevation Myocardial Infarction. It represents permanent coronary artery occlusion causing full-thickness myocardial necrosis, detectable by troponin elevation.",
    explanation: "STEMI is a medical emergency requiring immediate reperfusion therapy. Troponin and CK-MB rise after the ischemic injury has occurred, with troponin being the definitive marker.",
    difficulty: 2,
    bloomLevel: "recall",
    tags: ["STEMI", "cardiac biomarkers", "MI", "reperfusion"]
  }
];

const fs = require('fs');
const path = require('path');
const outPath = path.join(process.cwd(), 'data', 'extracted_cards', 'pages_0101-0110.json');
fs.writeFileSync(outPath, JSON.stringify(cards, null, 2));
console.log('Written ' + cards.length + ' flashcards to data/extracted_cards/pages_0101-0110.json');
