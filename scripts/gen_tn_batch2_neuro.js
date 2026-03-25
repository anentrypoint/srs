const fs = require('fs');
const cards = [];
let n = 1;
function add(topicId, question, answer, explanation, difficulty, bloomLevel, tags) {
  cards.push({ id: `card-tn2-neuro-${n++}`, question, answer, explanation, difficulty, bloomLevel, tags, topicId });
}

// NEURO-STROKE (15)
add('neuro-stroke','What are the components of the NIHSS and the maximum score?','The NIHSS has 11 items (level of consciousness, gaze, visual fields, facial palsy, motor arm, motor leg, limb ataxia, sensory, language, dysarthria, extinction/inattention) with a maximum score of 42.',
'The NIHSS is the standard acute stroke severity scale used in Canadian Stroke Best Practice Recommendations. Scores >25 indicate severe stroke with high mortality risk. Serial NIHSS measurements guide thrombolysis eligibility and post-treatment monitoring.',4,'recall',['NIHSS','stroke','assessment','neurology']);

add('neuro-stroke','What is the time window for IV alteplase (tPA) in acute ischemic stroke and the standard dose?','IV alteplase 0.9 mg/kg (max 90 mg), 10% as bolus and remainder over 60 min, within 4.5 hours of symptom onset.',
'Canadian Stroke Best Practice Recommendations endorse IV alteplase within 4.5 hours. Extended criteria (age >80, NIHSS >25, oral anticoagulant use, history of both stroke and diabetes) may exclude patients in the 3-4.5 hour window. BP must be <185/110 before administration.',5,'apply',['tPA','alteplase','thrombolysis','stroke','neurology']);

add('neuro-stroke','What are the absolute contraindications to IV alteplase in acute stroke?','Active internal bleeding, recent intracranial surgery/trauma (<3 months), intracranial hemorrhage on CT, platelet count <100,000, INR >1.7, aPTT elevated, BP >185/110 despite treatment.',
'These contraindications are from the Canadian Stroke Best Practice Recommendations and AHA/ASA guidelines. Any ICH on baseline CT is an absolute exclusion. Patients on DOACs with recent doses may also be excluded unless drug-specific reversal is available.',5,'recall',['tPA','contraindications','stroke','neurology']);

add('neuro-stroke','A patient presents 6 hours after stroke onset with NIHSS 14 and large vessel occlusion on CTA. What intervention is indicated?','Endovascular thrombectomy (EVT) with mechanical thrombectomy, eligible up to 24 hours with favorable perfusion imaging.',
'Canadian Stroke Best Practice Recommendations endorse EVT for large vessel occlusion (ICA, M1 MCA) up to 24 hours when CT perfusion shows salvageable tissue (per DAWN and DEFUSE-3 trials). Combined with IV tPA if within the 4.5-hour window.',5,'apply',['thrombectomy','EVT','large vessel occlusion','stroke','neurology']);

add('neuro-stroke','What is the recommended antiplatelet regimen for secondary stroke prevention after minor stroke or TIA?','Dual antiplatelet therapy (ASA + clopidogrel) for 21 days starting within 24 hours, then single antiplatelet long-term.',
'CHANCE and POINT trials demonstrated that short-term DAPT reduces recurrent stroke after minor stroke (NIHSS <=3) or high-risk TIA. Canadian Stroke Best Practice Recommendations adopted 21-day DAPT. Long-term DAPT is not recommended due to increased bleeding risk.',4,'apply',['DAPT','antiplatelet','secondary prevention','stroke','neurology']);

add('neuro-stroke','What blood pressure targets are recommended in the first 24 hours after acute ischemic stroke with and without thrombolysis?','With thrombolysis: <180/105 for 24 hours post-tPA. Without thrombolysis: permissive hypertension, only treat if >220/120.',
'Canadian Stroke Best Practice Recommendations advise against aggressive BP lowering in acute ischemic stroke to maintain cerebral perfusion. Post-tPA strict control prevents hemorrhagic transformation. Labetalol and nicardipine IV are preferred agents.',4,'apply',['blood pressure','stroke management','neurology']);

add('neuro-stroke','What is the ABCD2 score and how does it stratify TIA risk?','ABCD2: Age >=60 (1pt), BP >=140/90 (1pt), Clinical features-unilateral weakness (2pt) or speech only (1pt), Duration >=60min (2pt) or 10-59min (1pt), Diabetes (1pt). Score 0-3 low risk, 4-5 moderate, 6-7 high risk.',
'The ABCD2 score predicts 2-day stroke risk after TIA. Canadian guidelines recommend urgent investigation (within 24h) for ABCD2 >=4 or crescendo TIA. Carotid imaging and ECG should be obtained for all TIA patients regardless of score.',3,'apply',['ABCD2','TIA','risk stratification','neurology']);

add('neuro-stroke','When is carotid endarterectomy (CEA) indicated after ischemic stroke or TIA?','CEA is indicated for symptomatic carotid stenosis 70-99% (NASCET criteria). Moderate benefit for 50-69%. Should be performed within 2 weeks of the index event.',
'Canadian Stroke Best Practice Recommendations emphasize early CEA within 14 days of symptomatic event for maximal benefit (NNT of 6 for 70-99% stenosis). Carotid stenting is an alternative when surgical risk is high or anatomy is unfavorable.',4,'apply',['CEA','carotid stenosis','stroke prevention','neurology']);

add('neuro-stroke','What is the Bamford (OCSP) classification of ischemic stroke?','TACI (total anterior circulation infarct): all 3 of motor/sensory deficit, homonymous hemianopia, higher cortical dysfunction. PACI: 2 of 3. LACI: pure motor, pure sensory, ataxic hemiparesis, or dysarthria-clumsy hand. POCI: brainstem/cerebellar/occipital signs.',
'The Oxford/Bamford classification predicts prognosis and likely vessel territory without imaging. TACI has worst prognosis (~60% dependent or dead at 1 year). LACI indicates small vessel disease with better outcomes.',3,'recall',['OCSP','Bamford','stroke classification','neurology']);

add('neuro-stroke','What are the signs of a posterior circulation stroke?','Vertigo, diplopia, dysarthria, dysphagia, ataxia, crossed deficits (ipsilateral cranial nerve + contralateral motor/sensory), Horner syndrome, nystagmus, visual field defects.',
'Posterior circulation strokes are frequently missed as symptoms overlap with benign conditions. The HINTS exam (Head Impulse, Nystagmus, Test of Skew) differentiates central from peripheral causes with sensitivity >97% for stroke.',4,'recall',['posterior circulation','vertebrobasilar','stroke','neurology']);

add('neuro-stroke','What is the management of acute hemorrhagic stroke with elevated BP?','Target SBP <140 mmHg within 1 hour using IV nicardipine, labetalol, or clevidipine infusion. Reverse anticoagulation if applicable (vitamin K + PCC for warfarin, idarucizumab for dabigatran).',
'Canadian Stroke Best Practice Recommendations and INTERACT2 trial support rapid BP lowering to <140 systolic in ICH. PCC is preferred over FFP for warfarin reversal due to faster onset. Platelet transfusion is NOT recommended for antiplatelet-associated ICH.',5,'apply',['ICH','hemorrhagic stroke','blood pressure','neurology']);

add('neuro-stroke','What are the indications for decompressive craniectomy in ischemic stroke?','Malignant MCA infarction in patients <=60 years old, deteriorating level of consciousness, performed within 48 hours of onset. Reduces mortality from 78% to 29%.',
'DECIMAL, DESTINY, and HAMLET trials demonstrated mortality benefit. Canadian guidelines support this in patients <=60. In patients >60, benefit exists but with higher rates of severe disability (mRS 4-5).',5,'analyze',['craniectomy','malignant MCA','stroke','neurology']);

add('neuro-stroke','How does atrial fibrillation-related stroke prevention differ from other stroke etiologies?','AF-related stroke requires anticoagulation (DOACs preferred over warfarin per CCS guidelines) rather than antiplatelets. Use CHA2DS2-VASc to determine need. Initiate anticoagulation within 1-14 days after stroke depending on size.',
'CCS AF guidelines recommend DOACs as first-line over warfarin. The 1-3-6-12 day rule guides anticoagulation timing: TIA (day 1), small stroke (day 3), moderate (day 6), large/hemorrhagic conversion risk (day 12+).',4,'apply',['atrial fibrillation','anticoagulation','DOAC','stroke','neurology']);

add('neuro-stroke','What is the role of CT perfusion imaging in acute stroke decision-making?','CT perfusion identifies ischemic core (CBF <30%) vs penumbra (Tmax >6s). A mismatch ratio >=1.8 with ischemic core <70mL supports EVT up to 24 hours from onset.',
'DAWN and DEFUSE-3 trials established CT perfusion criteria for late-window thrombectomy. Automated software (RAPID) is used in Canadian stroke centres. This extends treatment to patients with unknown onset or wake-up strokes.',5,'analyze',['CT perfusion','penumbra','EVT','stroke imaging','neurology']);

add('neuro-stroke','What are the recommended lipid targets for secondary stroke prevention?','LDL <1.8 mmol/L (or >50% reduction from baseline) using high-intensity statin therapy. Consider adding ezetimibe or PCSK9 inhibitor if target not achieved.',
'Canadian Stroke Best Practice Recommendations align with CCS dyslipidemia guidelines for high-risk vascular patients. SPARCL trial demonstrated atorvastatin 80mg reduced recurrent stroke by 16%. Statins should be initiated during hospital admission.',4,'apply',['statin','LDL','lipid targets','stroke prevention','neurology']);

// NEURO-SEIZURE (15)
add('neuro-seizure','What is the definition and timeline of status epilepticus?','Continuous seizure activity >=5 minutes, or >=2 seizures without return to baseline between them. Refractory SE: persists after 2 appropriate AED trials. Super-refractory: continues >=24h after anesthetic initiation.',
'The 5-minute definition reflects evidence that seizures >5 minutes rarely self-terminate and cause neuronal injury. Canadian guidelines align with the Neurocritical Care Society protocol for staged management.',5,'recall',['status epilepticus','seizure','emergency','neurology']);

add('neuro-seizure','What is the step-by-step protocol for status epilepticus management?','Stage 1 (0-5 min): ABCs, IV access, glucose, lorazepam 4mg IV (repeat x1). Stage 2 (5-20 min): phenytoin 20mg/kg IV or levetiracetam 60mg/kg IV or valproate 40mg/kg IV. Stage 3 (20-40 min): intubation + midazolam or propofol infusion. Stage 4: ketamine or pentobarbital.',
'This staged approach follows Neurocritical Care Society and Canadian guidelines. Lorazepam IV is preferred (or midazolam IM if no IV access per RAMPART trial). Continuous EEG monitoring is essential in refractory SE.',5,'apply',['status epilepticus','protocol','seizure management','neurology']);

add('neuro-seizure','What is the first-line AED for each major seizure type?','Focal seizures: carbamazepine, lamotrigine, or levetiracetam. Generalized tonic-clonic: valproate or lamotrigine. Absence: ethosuximide or valproate. Myoclonic: valproate or levetiracetam. Note: carbamazepine and phenytoin can worsen absence and myoclonic seizures.',
'Selection follows ILAE guidelines. Valproate is avoided in women of childbearing potential due to teratogenicity (NTD risk ~7%). Lamotrigine and levetiracetam are preferred alternatives in this population.',4,'apply',['AED','seizure type','pharmacology','neurology']);

add('neuro-seizure','What are the ILAE 2017 criteria for the classification of seizure types?','Seizures classified by: (1) onset-focal, generalized, or unknown; (2) awareness-focal aware vs focal impaired awareness; (3) motor vs non-motor. Focal to bilateral tonic-clonic replaces secondary generalized.',
'The ILAE 2017 classification replaced the 1981 system. Simple partial and complex partial are replaced by focal aware and focal impaired awareness. This guides AED selection and surgical candidacy.',3,'recall',['ILAE','seizure classification','epilepsy','neurology']);

add('neuro-seizure','When can driving resume after a first unprovoked seizure in Canada?','Most Canadian provinces require a seizure-free interval of 3-12 months (varies by province) for private driving. Commercial driving typically requires 3-5 years seizure-free, often off medications.',
'Driving restrictions after seizures are provincially regulated. In Ontario, a first unprovoked seizure requires 6 months seizure-free; in Alberta, 12 months. Physicians have a legal duty to report in most provinces.',3,'recall',['driving','seizure','Canadian regulations','neurology']);

add('neuro-seizure','What workup is indicated after a first unprovoked seizure in an adult?','MRI brain (preferred over CT), routine EEG (sleep-deprived if routine is normal), basic bloodwork (electrolytes, glucose, calcium, magnesium, CBC, liver/renal function, toxicology screen). LP if infection suspected.',
'Canadian guidelines recommend MRI as the neuroimaging standard due to superior sensitivity for epileptogenic lesions. EEG abnormalities and MRI lesions are the strongest predictors of recurrence and guide the decision to start AED.',3,'apply',['first seizure','workup','investigation','neurology']);

add('neuro-seizure','What are the indications to start AED therapy after a first unprovoked seizure?','AED initiation is recommended when recurrence risk is high: abnormal EEG, structural brain lesion on MRI, nocturnal seizure, prior brain injury, or Todd paralysis. Without risk factors, observation is reasonable (2-year recurrence ~35%).',
'The decision balances recurrence risk (~45% at 2 years) against AED side effects. FIRST and MESS trials showed early treatment reduces recurrence but does not alter long-term remission rates. Canadian Epilepsy Alliance supports shared decision-making.',4,'analyze',['first seizure','AED','treatment decision','neurology']);

add('neuro-seizure','What are the key teratogenic risks of AEDs and the recommended approach for women of childbearing age?','Valproate has highest teratogenicity (NTD 7%, IQ reduction). Phenytoin, carbamazepine, phenobarbital carry moderate risk. Lamotrigine and levetiracetam have lowest risk. All women on AEDs should take folic acid 5 mg/day.',
'SOGC and Canadian guidelines recommend high-dose folic acid (5 mg/day) for women on AEDs starting 3 months preconception. Valproate should be avoided if possible. AED levels should be monitored during pregnancy due to pharmacokinetic changes.',5,'apply',['teratogenicity','AED','pregnancy','folic acid','neurology']);

add('neuro-seizure','What distinguishes epileptic seizures from psychogenic non-epileptic events (PNEE)?','PNEE features: asynchronous limb movements, side-to-side head shaking, pelvic thrusting, eye closure during event, prolonged duration (>2 min), preserved awareness with bilateral movements, no post-ictal confusion. Diagnosis confirmed by video-EEG.',
'PNEE account for 20-30% of patients referred to Canadian epilepsy monitoring units. Up to 10% have both epilepsy and PNEE. Treatment involves CBT and psychiatric care; AEDs should not be escalated for PNEE.',4,'analyze',['PNEE','psychogenic seizure','differential diagnosis','neurology']);

add('neuro-seizure','What are the surgical options for drug-resistant epilepsy?','Resective surgery (temporal lobectomy for mesial temporal sclerosis-60-80% seizure-free), lesionectomy, corpus callosotomy (for drop attacks), vagus nerve stimulator, responsive neurostimulation (RNS). Drug resistance: failure of 2 appropriate AED trials.',
'Canadian Epilepsy Surgery Centres follow ILAE criteria. Temporal lobectomy is the most effective intervention (Engel Class I in 60-80%). Presurgical evaluation includes video-EEG, MRI, neuropsychology, and may include invasive EEG.',5,'analyze',['epilepsy surgery','drug-resistant','temporal lobectomy','neurology']);

add('neuro-seizure','How should acute seizures from alcohol withdrawal be managed?','Alcohol withdrawal seizures occur 6-48h after last drink, usually generalized tonic-clonic. Treat with IV benzodiazepines. Do NOT start chronic AEDs-phenytoin is ineffective for withdrawal seizures. Prevent with CIWA-guided benzodiazepine protocol.',
'Alcohol withdrawal seizures are provoked and do not require long-term AED therapy. Up to 1/3 progress to delirium tremens if untreated. Canadian Addiction Medicine guidelines recommend symptom-triggered benzodiazepine protocols.',4,'apply',['alcohol withdrawal','seizure','benzodiazepine','neurology']);

add('neuro-seizure','What are the EEG patterns associated with specific epilepsy syndromes?','3 Hz spike-and-wave: childhood absence. Hypsarrhythmia: infantile spasms (West syndrome). Centrotemporal spikes: benign rolandic epilepsy. Generalized polyspike-and-wave: juvenile myoclonic epilepsy. PLEDs: herpes encephalitis or acute structural lesion.',
'EEG pattern recognition is essential for epilepsy syndrome diagnosis. Childhood absence has the most recognizable pattern (3 Hz generalized spike-wave activated by hyperventilation). JME presents in adolescence with morning myoclonic jerks.',3,'recall',['EEG','epilepsy syndromes','patterns','neurology']);

add('neuro-seizure','What is the SUDEP risk and how is it communicated?','SUDEP incidence is ~1/1000 patient-years in chronic epilepsy, ~1/150 in drug-resistant epilepsy. Risk factors: uncontrolled GTCS, nocturnal seizures, non-adherence. Reduced by optimizing seizure control.',
'Canadian Epilepsy Alliance recommends SUDEP counselling for all epilepsy patients. SUDEP is the leading cause of premature death in epilepsy. The mechanism likely involves post-ictal respiratory and cardiac dysfunction.',4,'recall',['SUDEP','mortality','epilepsy','neurology']);

add('neuro-seizure','What medication interactions are critical to know for AEDs?','Enzyme inducers (carbamazepine, phenytoin, phenobarbital) reduce efficacy of OCPs, warfarin, and many drugs. Valproate inhibits metabolism and increases lamotrigine levels (reduce lamotrigine dose by 50%). Levetiracetam has minimal interactions.',
'The valproate-lamotrigine interaction doubles lamotrigine levels and increases Stevens-Johnson syndrome risk. Women on enzyme-inducing AEDs need higher-dose OCP or non-oral contraception per SOGC guidelines.',4,'apply',['drug interactions','AED','pharmacology','neurology']);

add('neuro-seizure','What is the approach to febrile seizures and when do they require investigation?','Simple febrile seizures (<15 min, generalized, single episode, age 6mo-5yr): reassurance only. Complex (>15 min, focal, recurrent within 24h, or age <6mo): require investigation. LP if <12 months or clinical concern. EEG and MRI not routinely indicated for simple FS.',
'CPS guidelines state simple febrile seizures carry no increased epilepsy risk above baseline (~1%). Risk factors for recurrence: age <18 months, lower temperature at seizure. Antipyretics do NOT prevent febrile seizures.',3,'apply',['febrile seizure','pediatrics','investigation','neurology']);

// NEURO-MS (10)
add('neuro-ms','What are the McDonald 2017 criteria for diagnosing multiple sclerosis?','MS requires dissemination in space (DIS) and time (DIT). DIS: >=1 T2 lesion in >=2 of 4 CNS areas (periventricular, cortical/juxtacortical, infratentorial, spinal cord). DIT: simultaneous enhancing and non-enhancing lesions, OR new lesion on follow-up, OR CSF oligoclonal bands.',
'The 2017 McDonald criteria allow earlier MS diagnosis by incorporating CSF oligoclonal bands as a substitute for DIT. This enables diagnosis at CIS with appropriate MRI and CSF findings, facilitating earlier treatment.',4,'recall',['McDonald criteria','MS diagnosis','MRI','neurology']);

add('neuro-ms','What are the first-line disease-modifying therapies for relapsing-remitting MS in Canada?','First-line: interferon beta, glatiramer acetate, teriflunomide, dimethyl fumarate. High-efficacy: natalizumab, fingolimod, ocrelizumab. Highly active disease: alemtuzumab, cladribine.',
'Canadian MS Treatment Optimization Recommendations support both escalation and early intensive strategies. High-efficacy therapies reduce relapse rate by 50-70% vs interferon at 30%. Treatment choice considers JC virus status and family planning.',4,'apply',['DMT','MS treatment','disease-modifying therapy','neurology']);

add('neuro-ms','How is an acute MS relapse managed?','IV methylprednisolone 1g daily for 3-5 days. Oral prednisone 1250 mg for 3 days is non-inferior (COPOUSEP trial). Plasma exchange for steroid-refractory relapses. Must involve new/worsening deficit lasting >24 hours without fever/infection.',
'Canadian guidelines align with AAN recommendations for high-dose corticosteroids. Pseudo-relapses (worsening due to infection, heat, stress) should be excluded before steroids. Tapered oral steroids lack strong evidence.',4,'apply',['MS relapse','corticosteroids','treatment','neurology']);

add('neuro-ms','What is the risk of PML with natalizumab and how is it mitigated?','PML risk depends on: JC virus antibody status, anti-JCV antibody index (>1.5 = higher risk), and prior immunosuppressant use. Risk ranges from <1/10,000 (JCV negative) to ~1/80 (JCV+ with index >1.5 and prior IS). Mitigation: JCV testing q6 months, extended interval dosing.',
'PML is a devastating JC virus reactivation. Canadian MS clinics routinely monitor JCV status. Extended interval dosing (every 6-8 weeks) reduces PML risk while maintaining efficacy. Ocrelizumab is a common switch option.',5,'analyze',['PML','natalizumab','JC virus','MS','neurology']);

add('neuro-ms','What are the typical CSF findings in MS?','Oligoclonal bands present in CSF but not serum (>95% sensitivity), elevated IgG index (>0.7), mildly elevated WBC (<50 lymphocytes), normal-mildly elevated protein. CSF is not required if MRI criteria are met.',
'CSF oligoclonal bands are the most sensitive lab finding. The 2017 McDonald criteria allow OCBs to substitute for dissemination in time. CSF is particularly valuable when MRI findings are equivocal.',3,'recall',['CSF','oligoclonal bands','MS diagnosis','neurology']);

add('neuro-ms','What distinguishes MS subtypes (RRMS, SPMS, PPMS)?','RRMS (85%): discrete relapses with recovery, stable between attacks. SPMS: RRMS transitioning to progressive worsening without distinct relapses. PPMS (10-15%): progressive from onset, typically progressive myelopathy, equal sex ratio.',
'RRMS converts to SPMS at ~2-3% per year untreated. PPMS has later onset (~40) and fewer MRI lesions. Ocrelizumab is the only DMT with PPMS evidence (ORATORIO trial). Canadian guidelines recommend annual screening for progression.',3,'recall',['MS subtypes','RRMS','SPMS','PPMS','neurology']);

add('neuro-ms','How is NMOSD distinguished from MS and why does it matter?','NMOSD: AQP4-IgG antibody positive, severe bilateral optic neuritis and longitudinally extensive transverse myelitis (>=3 vertebral segments). Brain MRI often normal early. Treatment: azathioprine, rituximab, eculizumab. Interferon beta WORSENS NMOSD.',
'NMOSD must be distinguished because MS therapies (interferons, fingolimod) can exacerbate it. AQP4-IgG has >99% specificity. Canadian neurologists test AQP4 antibodies in any patient with optic neuritis or longitudinally extensive myelitis.',4,'analyze',['NMOSD','Devic disease','AQP4','differential diagnosis','neurology']);

add('neuro-ms','What are the EDSS score milestones in MS?','EDSS 0: normal exam. 4.0: walks >500m without aid. 6.0: requires unilateral assistance to walk 100m. 6.5: bilateral assistance. 7.0: wheelchair-bound. 8.0: bed-bound. 10.0: death from MS.',
'The EDSS is the standard disability measure in MS trials and Canadian MS clinics. Key limitation is heavy weighting toward ambulation. EDSS 4.0 and 6.0 are major milestones used in treatment decisions.',3,'recall',['EDSS','disability','MS assessment','neurology']);

add('neuro-ms','What is the recommended MRI monitoring protocol for MS patients on DMT?','Baseline MRI brain and spinal cord before starting DMT. Follow-up at 6 months then annually. New T2 or gadolinium-enhancing lesions on therapy indicate breakthrough disease requiring DMT reassessment.',
'Canadian MS Treatment Optimization Recommendations define breakthrough disease as new MRI activity, relapses, or disability progression on DMT. MRI is the most sensitive measure. Spinal cord MRI is added when clinical features suggest cord involvement.',3,'apply',['MRI monitoring','DMT','MS follow-up','neurology']);

add('neuro-ms','What are the common presentations of clinically isolated syndrome (CIS)?','Optic neuritis (25%): unilateral painful vision loss. Transverse myelitis: band-like sensory level, weakness, urinary retention. Brainstem syndrome: diplopia, vertigo, INO, facial numbness. Lhermitte sign. Uhthoff phenomenon: symptom worsening with heat.',
'CIS is the first clinical demyelinating event. MRI showing >=2 T2 lesions at CIS predicts 80%+ conversion to MS. Canadian neurologists initiate DMT at CIS when McDonald criteria are met to delay disability.',3,'recall',['CIS','optic neuritis','MS presentation','neurology']);

// NEURO-DEMENTIA (15)
add('neuro-dementia','What is the recommended initial workup for suspected dementia?','Cognitive testing (MoCA preferred), bloodwork (CBC, electrolytes, calcium, glucose, TSH, B12, folate), and neuroimaging (CT or MRI brain). Consider HIV, syphilis serology in appropriate contexts.',
'CCCD recommends MoCA over MMSE for screening (better sensitivity for MCI). Reversible causes must be excluded. MRI is preferred for vascular and frontotemporal patterns.',3,'apply',['dementia workup','investigation','MoCA','neurology']);

add('neuro-dementia','What distinguishes Alzheimer, frontotemporal, Lewy body, and vascular dementia?','AD: episodic memory loss, temporal-parietal atrophy. FTD: personality/behavioral change or progressive aphasia, age <65. DLB: fluctuating cognition, visual hallucinations, parkinsonism, REM sleep behavior disorder. VaD: stepwise decline, executive dysfunction, white matter disease.',
'Distinguishing subtypes is high-yield for MCCQE1. DLB patients have severe neuroleptic sensitivity. FTD is the second most common young-onset dementia. CCCD guidelines emphasize clinical phenotyping.',4,'analyze',['dementia subtypes','differential diagnosis','Alzheimer','DLB','neurology']);

add('neuro-dementia','What pharmacological treatments are available for Alzheimer disease?','Cholinesterase inhibitors (donepezil 5-10mg, rivastigmine, galantamine) for mild-moderate AD. Memantine (NMDA antagonist) for moderate-severe AD. Can combine ChEI + memantine.',
'CCCD guidelines recommend ChEIs as first-line for mild-moderate AD. Side effects: GI (nausea, diarrhea), bradycardia, syncope. Memantine added at moderate stage (MMSE 10-20). Reassess at 3-6 months.',4,'apply',['Alzheimer treatment','cholinesterase inhibitors','memantine','neurology']);

add('neuro-dementia','What is the MoCA test and how does it compare to MMSE?','MoCA: 30-point test assessing visuospatial/executive, naming, memory, attention, language, abstraction, orientation. Score <26 suggests impairment (+1 if <=12 years education). MoCA detects MCI better than MMSE (sensitivity 90% vs 18%).',
'MoCA was developed in Montreal and is the preferred Canadian screening tool. It assesses executive function more thoroughly than MMSE, making it superior for vascular cognitive impairment and MCI.',3,'recall',['MoCA','MMSE','cognitive screening','neurology']);

add('neuro-dementia','What are the diagnostic criteria for mild cognitive impairment (MCI)?','Subjective cognitive complaint, objective impairment on testing (1-1.5 SD below norms), preserved functional independence (ADLs intact), does NOT meet dementia criteria. Subtypes: amnestic and non-amnestic.',
'Amnestic MCI converts to AD at ~10-15% per year. Canadian guidelines recommend annual reassessment. No pharmacological treatment is recommended for MCI. Exercise and vascular risk management are advised.',3,'recall',['MCI','mild cognitive impairment','diagnosis','neurology']);

add('neuro-dementia','What are the potentially reversible causes of dementia?','Hypothyroidism, B12 deficiency, neurosyphilis, HIV, normal pressure hydrocephalus (gait apraxia, incontinence, dementia), chronic subdural hematoma, depression (pseudodementia), medication effects (anticholinergics, benzodiazepines).',
'CCCD guidelines mandate screening for reversible causes. NPH is treatable with VP shunt. Depression-related pseudodementia improves with antidepressants. Anticholinergic burden is a major modifiable risk factor in elderly.',3,'recall',['reversible dementia','differential diagnosis','NPH','neurology']);

add('neuro-dementia','What is the management hierarchy for behavioral symptoms of dementia (BPSD)?','(1) Non-pharmacological first: caregiver education, structured routines, music therapy, redirection. (2) Risperidone (only antipsychotic with Health Canada approval for BPSD) at lowest dose. (3) Avoid benzodiazepines and anticholinergics.',
'CCCD guidelines emphasize non-pharmacological approaches first. Antipsychotics carry a black box warning for increased mortality in elderly dementia patients (1.6-1.7x). Attempt tapering q3 months.',4,'apply',['BPSD','behavioral symptoms','antipsychotics','dementia management','neurology']);

add('neuro-dementia','What is the presentation and management of normal pressure hydrocephalus?','Triad: gait apraxia (magnetic gait, first symptom), urinary incontinence, cognitive decline. Ventriculomegaly on imaging (Evans index >0.3). CSF tap test: removal of 30-50 mL improves gait. Treatment: VP shunt.',
'NPH is one of few surgically treatable dementias. CSF tap test has ~50-80% sensitivity for predicting shunt response. VP shunt improves gait in ~80%, cognition in ~50% of selected patients.',4,'apply',['NPH','normal pressure hydrocephalus','treatable dementia','neurology']);

add('neuro-dementia','What genetic risk factors and biomarkers are relevant in Alzheimer disease?','APOE e4: strongest genetic risk (3x heterozygote, 12x homozygote). Early-onset AD genes: APP, PSEN1, PSEN2 (autosomal dominant). Biomarkers: CSF Abeta42 (decreased), CSF tau/p-tau (increased), amyloid PET.',
'APOE testing is not recommended for routine diagnosis per Canadian guidelines. CSF biomarkers are primarily research tools in Canada. Plasma p-tau217 is an emerging blood-based biomarker.',4,'recall',['APOE','biomarkers','Alzheimer genetics','neurology']);

add('neuro-dementia','How is Lewy body dementia managed differently from other dementias?','DLB responds to ChEIs (rivastigmine preferred). AVOID antipsychotics-severe neuroleptic sensitivity. If needed: quetiapine at lowest dose only. Parkinsonism: cautious low-dose levodopa. RBD: melatonin first-line.',
'Neuroleptic sensitivity in DLB is a critical safety concern. Up to 50% experience severe reactions to antipsychotics. DLB has the best ChEI response among dementias. Visual hallucinations alone may not require treatment if non-distressing.',5,'apply',['Lewy body dementia','neuroleptic sensitivity','DLB treatment','neurology']);

add('neuro-dementia','What non-pharmacological interventions have evidence for dementia prevention?','Physical exercise (strongest evidence), cognitive stimulation, Mediterranean diet, vascular risk factor management, social engagement, hearing aid use for hearing loss. Midlife hearing loss treatment may reduce risk by 8%.',
'Lancet Commission identified 12 modifiable risk factors for 40% of dementias. Canadian Brain Health Strategy emphasizes midlife hypertension treatment, activity, and social engagement. FINGER trial showed multimodal lifestyle intervention benefit.',3,'recall',['dementia prevention','lifestyle','risk factors','neurology']);

add('neuro-dementia','What is the prognosis of different dementia types?','AD: median 8-10 years. VaD: stepwise, 5-year survival. DLB: 5-7 years, faster decline. FTD: 6-8 years. CJD: rapid progressive dementia, death in <1 year.',
'Understanding trajectories aids prognostication and advance care planning. Canadian guidelines recommend early goals-of-care discussions. CJD should be suspected with rapid dementia + myoclonus + periodic sharp waves on EEG.',3,'recall',['dementia prognosis','trajectory','survival','neurology']);

add('neuro-dementia','When is genetic testing indicated in dementia?','Early-onset AD (<65) with autosomal dominant pattern, suspected genetic FTD (C9orf72, GRN, MAPT). FTD has highest heritability (~40% family history). APOE genotyping NOT recommended routinely.',
'Canadian guidelines are conservative on genetic testing. C9orf72 causes both FTD and ALS. Genetic counseling is mandatory before and after testing. Early-onset AD genes: APP, PSEN1, PSEN2.',4,'analyze',['genetic testing','familial dementia','early-onset','neurology']);

add('neuro-dementia','What tools are used for staging dementia severity?','GDS (Global Deterioration Scale): 7 stages. CDR (Clinical Dementia Rating): 0-3 scale. FAST: 7 stages aligned with AD. Practical: mild (MMSE 20-26), moderate (10-19), severe (<10).',
'GDS and CDR are used in Canadian clinical practice. FAST >=7A predicts <6 month survival for palliative care referral. ChEIs continued until moderate-severe stage, then reassessed.',3,'recall',['dementia staging','GDS','CDR','FAST','neurology']);

add('neuro-dementia','What medicolegal issues arise in dementia care in Canada?','Capacity is decision-specific. Power of attorney should be established early. Mandatory driving reporting in most provinces. Elder abuse screening. Cognitive impairment does not automatically negate capacity.',
'In Canada, capacity must be assessed for each specific decision per provincial legislation (e.g., Ontario Substitute Decisions Act). Physicians must report unfit drivers to the Ministry of Transportation in most provinces.',4,'apply',['capacity','medicolegal','driving','dementia','neurology']);

// NEURO-HEADACHE (10)
add('neuro-headache','What are the ICHD-3 diagnostic criteria for migraine without aura?','>=5 attacks lasting 4-72 hours with >=2 of: unilateral, pulsating, moderate-severe, aggravated by activity; AND >=1 of: nausea/vomiting, photophobia and phonophobia.',
'ICHD-3 criteria are the gold standard. Migraine affects ~12% of Canadians (F:M 3:1). MCCQE1 expects distinguishing migraine from tension-type and cluster headache.',3,'recall',['migraine criteria','ICHD-3','headache diagnosis','neurology']);

add('neuro-headache','What are the first-line and second-line prophylactic medications for migraine?','First-line: propranolol (40-240mg), amitriptyline (10-75mg), topiramate (50-200mg), candesartan (16mg). Second-line: venlafaxine, valproate. CGRP mAbs (erenumab, fremanezumab) after failing >=2 preventives. Start prophylaxis when >=4 migraine days/month.',
'Canadian Headache Society recommends >=2-month trial at adequate dose. Topiramate is contraindicated in pregnancy. CGRP antibodies available in Canada with special authorization.',4,'apply',['migraine prophylaxis','prevention','pharmacology','neurology']);

add('neuro-headache','What are the diagnostic features and treatment of cluster headache?','Severe unilateral orbital/temporal pain 15-180 min with ipsilateral autonomic features (lacrimation, conjunctival injection, nasal congestion, ptosis). Acute: sumatriptan SC 6mg or high-flow O2 12-15 L/min. Prophylaxis: verapamil first-line.',
'Cluster headache has M:F 3:1 (opposite of migraine). High-flow oxygen is uniquely effective with no contraindications. Verapamil requires ECG monitoring for PR prolongation.',4,'apply',['cluster headache','trigeminal autonomic cephalalgia','treatment','neurology']);

add('neuro-headache','What red flags (SNOOP) warrant urgent headache investigation?','S: Systemic symptoms (fever, cancer, HIV). N: Neurological signs. O: Onset sudden (thunderclap). O: Older (>50, new onset). P: Pattern change, positional, Valsalva-precipitated, papilledema, progressive, pregnancy/postpartum.',
'Thunderclap headache mandates CT + LP to rule out SAH (CT ~95% sensitive within 6 hours). Canadian guidelines support CTA within 6 hours as potentially sufficient without LP.',4,'apply',['red flags','secondary headache','SNOOP','neurology']);

add('neuro-headache','What is medication overuse headache and how is it managed?','MOH: acute medications >=10-15 days/month for >3 months (triptans/opioids >=10 days; simple analgesics >=15 days). Management: withdraw offending medication, bridge with naproxen or prednisone taper, start preventive.',
'MOH is the third most common headache disorder and a major cause of chronic daily headache. Withdrawal headache lasts 2-10 days for triptans, longer for opioids. Patient education on limiting acute medication is essential.',4,'apply',['medication overuse headache','MOH','chronic headache','neurology']);

add('neuro-headache','How is subarachnoid hemorrhage diagnosed?','CT head (98% sensitive within 6h, drops to 50% by day 7). If CT negative: LP at >=6-12 hours for xanthochromia. CTA to identify aneurysm. Treatment: nimodipine 60mg q4h for 21 days; secure aneurysm within 24 hours.',
'Ottawa SAH Rule identifies patients needing investigation. Recent Canadian data suggest CTA within 6 hours may suffice without LP. Nimodipine prevents vasospasm. Aneurysm secured by clipping or coiling.',5,'apply',['SAH','subarachnoid hemorrhage','thunderclap headache','neurology']);

add('neuro-headache','What is the acute migraine treatment algorithm in the ED?','First-line: IV metoclopramide 10-20mg + diphenhydramine 25-50mg. Alternatives: ketorolac 30mg IV, prochlorperazine 10mg IV. Avoid opioids. Dexamethasone 10mg IV reduces 72-hour recurrence (NNT 9).',
'Canadian Headache Society and CAEP guidelines emphasize dopamine antagonists as ED first-line, not opioids. Dexamethasone single dose prevents recurrence. IV fluids recommended for dehydrated patients.',4,'apply',['migraine ED treatment','acute management','neurology']);

add('neuro-headache','What features distinguish tension-type headache from migraine?','TTH: bilateral, pressing/tightening, mild-moderate, NOT aggravated by activity, no nausea, may have photophobia OR phonophobia (not both). Duration 30 min to 7 days. Prophylaxis for chronic TTH: amitriptyline.',
'TTH is the most common primary headache but less disabling. Chronic TTH (>=15 days/month) should be distinguished from MOH and chronic migraine. Canadian guidelines recommend limiting analgesic use.',2,'recall',['tension headache','TTH','differential diagnosis','neurology']);

add('neuro-headache','What is the evaluation and treatment of idiopathic intracranial hypertension?','Overweight woman with daily headache, pulsatile tinnitus, visual obscurations, papilledema. Opening pressure >25 cmH2O, normal CSF, normal MRI. Treatment: weight loss, acetazolamide 500-1000mg BID. Surgery if vision threatened.',
'IIH requires urgent ophthalmologic assessment. Acetazolamide is primary therapy (IIHTT trial). Canadian guidelines recommend 5-10% weight loss. Topiramate is second-line (promotes weight loss + reduces CSF).',4,'apply',['IIH','pseudotumor cerebri','papilledema','neurology']);

add('neuro-headache','What are the CGRP-targeted therapies for migraine?','CGRP mAbs: erenumab (anti-receptor), fremanezumab, galcanezumab (anti-ligand)-monthly/quarterly SC. Gepants (rimegepant, ubrogepant): acute treatment. Available in Canada after failing 2-3 conventional preventives.',
'CGRP therapies are migraine-specific with minimal side effects. Unlike triptans, they have no vasoconstrictive effects and are not contraindicated in cardiovascular disease. Canadian Headache Society supports use after conventional failures.',4,'apply',['CGRP','migraine therapy','erenumab','neurology']);

fs.writeFileSync('C:/dev/srs-mccqe1/data/_neuro_cards.json', JSON.stringify(cards, null, 2));
console.log('Neurology cards written:', cards.length);
