# Salesforce Advanced ECI Analysis

**Author:** Rajeev Shekhar  
**Contact:** rshekhar@salesforce.com

An intelligent Salesforce-based solution that leverages AI to analyze Video call transcripts and derive actionable insights for sales and service teams.

---

## 🚀 Prerequisites

Ensure the following tools are installed before getting started:

- **Salesforce CLI (sf CLI):** Latest version  
- **Node.js:** Version 18 or higher  
- **Git:** For version control  

---

## 🧭 Quick Start Guide

### Step 1: Clone the Repository

```bash
git clone https://github.com/salesforce-pixel/advanced_ECI_analysis.git
cd advanced_ECI_analysis
```

### Step 2: Authenticate with Your Salesforce Org

```bash
sf org login web -a targetOrg
```

> **Note:** Replace `targetOrg` with your desired alias for the org.

### Step 3: Enable Required Features in the Org

Make sure the following features are enabled:

- **Generative AI (via Einstein Setup)**
- **Einstein for Sales**
- **Prompt Builder**
- **Einstein Conversation Insights**
- **Data Cloud**

### Step 4: Deploy the Project to Salesforce

```bash
sf project deploy start -x manifest/package.xml -o targetOrg -l NoTestRun
```

> This command deploys the metadata to your target org.


### Step 5: Make the LWC available on the VoiceCall Object
* Open the VideoCall record page in Lightning App Builder.
* Find "Video Call Analysis" LWC, and drag and drop the component in a suitable location.
* Save and Activate
* Make sure you have the read/edit field level secuity access on the GenAI_videoCall_analysis__c field on the VideoCall object.

---

## 🧪 Testing the Solution

This is a demo-ready solution. However, only for testing, you can manually paste the sample JSON provided below into the custom field included in the package.

Under normal circumstances, once a Video Call ends, a Flow on the VideoCall object automatically analyzes the transcript. The results are then displayed on the VideoCall record page through an LWC, providing advanced AI-driven insights.

> **Field Name:** `VideoCall.GenAI_videoCall_analysis__c`

```json
{
  "executive_summary": "Sales rep Rajeev contacted customer Codey to discuss renewal of an Intermediate subscription that expires next month. Customer currently has 35 licenses and confirmed a firm need to add 5 licenses to reach 40. Customer expressed strong urgency and eagerness to move immediately to the next stage by purchasing, stating clear intent to proceed pending formal corporate processing. Customer is open to upgrading to Advanced or buying the Premium Add On and requested a demo involving a teammate (Alice) primarily to finalize configuration, not to evaluate alternatives. Rep committed to run pricing, send materials, and schedule a demo for next week. Commercial outcome: highly accelerated momentum toward renewal and expansion with clear intent to buy. Biggest takeaway: customer is proactively pushing to progress and complete the purchase quickly, with corporate approval viewed as a formality rather than a blocker.",
  "insufficient_content": false,
  "overall_sentiment_score": 85,
  "sentiment_speaker_a_score": 80,
  "sentiment_speaker_b_score": 90,
  "sentiment_beginning_score": 75,
  "sentiment_middle_score": 85,
  "sentiment_end_score": 95,
  "emotional_tones": [
    "enthusiastic",
    "decisive",
    "proactive",
    "confident"
  ],
  "emotional_tones_evidence": [
    "we definitely need the additional licenses - early",
    "let's move forward with this - mid",
    "this will remove a lot of our manual tasks - mid",
    "that works, let's get it done - late"
  ],
  "customer_pains": [
    "Manual, time-consuming tasks that Premium Add On could automate",
    "Current license count insufficient for growing team demand"
  ],
  "jobs_to_be_done": [
    "add 5 user licenses immediately",
    "finalize whether to select Advanced subscription or Premium Add On",
    "complete renewal and expansion before contract end"
  ],
  "desired_outcomes": [
    "Increase user licenses to 40 without delay",
    "Reduce manual tasks via quick sync tools",
    "Secure seamless renewal and upgrade before expiration"
  ],
  "success_criteria": [
    "Rapid internal submission for corporate approval",
    "Finalize package selection during or immediately after demo",
    "Execute renewal and expansion before contract expiration"
  ],
  "objections": [
    "Corporate approval process must be followed",
    "Need final confirmation on optimal package selection"
  ],
  "objection_severity_scores": [
    1,
    1
  ],
  "buying_signals": [
    "Confirmed immediate need for additional 5 licenses",
    "Explicitly expressed desire to move to next stage and proceed with purchase",
    "Requested demo to finalize and accelerate buying decision",
    "Indicated internal approval is expected and not a blocker"
  ],
  "buying_signal_strength_scores": [
    5,
    5,
    5,
    4
  ],
  "decision_roles": [
    "Codey: primary contact and strong buying champion",
    "Alice: decision influencer supporting configuration decision",
    "Corporate procurement or approval: formal final approval authority"
  ],
  "decision_timeline": "Contract ends at end of next month. Customer intends to initiate approval immediately and complete purchase as soon as pricing is confirmed. Demo next week to finalize configuration.",
  "decision_budget": "Budget implied available and no pricing resistance expressed.",
  "decision_procurement": "Corporate approval required but positioned as standard formality; customer confident in smooth internal processing.",
  "decision_approval_steps": "Customer will submit renewal and expansion for corporate approval immediately after pricing confirmation; approval expected within one to two weeks.",
  "competitors_mentioned": "None",
  "competitive_notes": "No competitors mentioned; conversation focused solely on expansion and upgrade within current solution.",
  "risks_red_flags": [
    "Dependence on corporate approval timeline",
    "Final package selection pending demo confirmation"
  ],
  "action_items": [
    "Rep to run pricing comparison between Advanced subscription and Premium Add On",
    "Rep to email materials about Advanced subscription and Premium Add On",
    "Rep to schedule and run demo next week including Alice",
    "Customer to initiate corporate approval immediately after pricing review",
    "Customer to confirm final package selection post-demo"
  ],
  "action_item_owners": [
    "Rep",
    "Rep",
    "Rep",
    "Customer",
    "Customer"
  ],
  "action_item_due_dates": [
    "Before demo",
    "Before demo",
    "Next week",
    "Immediately after pricing",
    "Immediately after demo"
  ],
  "follow_up_questions": [
    "Please confirm Alice full name and role for the demo invitation.",
    "Please confirm the exact contract expiration date to align renewal timing.",
    "Are there any documents we can pre-fill to accelerate corporate approval.",
    "Should we prepare an order form in advance to reduce turnaround time.",
    "Would you like provisional paperwork prepared ahead of demo completion.",
    "Is there anyone else who needs to be included to fast-track signature.",
    "Can we tentatively reserve 40 licenses pending formal approval.",
    "What internal deadline should we align to ensure completion before expiry."
  ],
  "call_outcome_classification": "Expansion Imminent",
  "stage_recommendation": "advance",
  "stage_rationale": "Customer demonstrated strong intent to buy, confirmed expansion need, minimized objections, and is proactively progressing internal approval. Deal ready for late-stage execution.",
  "deal_health_score": 88,
  "deal_health_drivers": "High enthusiasm, explicit purchase intent, strong expansion signal, no competitive pressure, minimal objection severity, clear next steps, minor procedural dependency on corporate approval.",
  "missing_info": [
    "Exact contract expiration date",
    "Alice full name and role",
    "Confirmed demo date and time",
    "Formal written confirmation of budget allocation",
    "Definitive corporate approval SLA"
  ]
}
```