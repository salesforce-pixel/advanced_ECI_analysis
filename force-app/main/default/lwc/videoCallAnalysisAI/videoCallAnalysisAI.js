import { LightningElement, api, track, wire } from 'lwc';
import { getRecord, getFieldValue } from 'lightning/uiRecordApi';
import { updateRecord } from 'lightning/uiRecordApi';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

// ✅ Use schema import (recommended)
import ANALYSIS_FIELD from '@salesforce/schema/VideoCall.GenAI_videoCall_analysis__c';
import RELATED_RECORD_ID_FIELD from '@salesforce/schema/VideoCall.RelatedRecordId';

// Opportunity fields to update
import OPP_ID_FIELD from '@salesforce/schema/Opportunity.Id';
import OPP_DESCRIPTION_FIELD from '@salesforce/schema/Opportunity.Description';
import OPP_STAGENAME_FIELD from '@salesforce/schema/Opportunity.StageName';
import OPP_CLOSEDATE_FIELD from '@salesforce/schema/Opportunity.CloseDate';
import OPP_NEXTSTEP_FIELD from '@salesforce/schema/Opportunity.NextStep';

// Apex
import runOppAnalysis from '@salesforce/apex/VideoCallOpportunityUpdateController.runAnalysis';

export default class VideoCallAnalysisAI extends LightningElement {
    @api recordId;

    @track parsedAnalysis = null;
    @track isLoading = true;
    @track errorMessage = '';

    // Backing data for action items (checkbox binding)
    @track actionItemsData = [];

    // Selection Set (must be reassigned for reactivity)
    selectedActions = new Set();

    // ✅ NEW: related opportunity id
    relatedOpportunityId;

    // ✅ NEW: modal state + draft fields
    @track isOppModalOpen = false;
    @track isOppModalLoading = false;

    @track oppDraftDescription = '';
    @track oppDraftStageName = '';
    @track oppDraftCloseDate = '';
    @track oppDraftNextStep = '';

    @wire(getRecord, { recordId: '$recordId', fields: [ANALYSIS_FIELD, RELATED_RECORD_ID_FIELD] })
    wiredRecord({ error, data }) {
        // Reset per-wire run
        this.isLoading = true;
        this.errorMessage = '';
        this.parsedAnalysis = null;
        this.actionItemsData = [];
        this.selectedActions = new Set();
        this.relatedOpportunityId = null;

        if (data) {
            try {
                const analysisJson = getFieldValue(data, ANALYSIS_FIELD);
                this.relatedOpportunityId = getFieldValue(data, RELATED_RECORD_ID_FIELD);

                if (analysisJson) {
                    this.parsedAnalysis = JSON.parse(analysisJson);
                    this.processActionItems();
                } else {
                    this.errorMessage = 'No analysis data available for this call';
                }
            } catch (e) {
                this.errorMessage = `Error parsing analysis data: ${e?.message || e}`;
            } finally {
                this.isLoading = false;
            }
        } else if (error) {
            this.errorMessage =
                'Error loading call analysis: ' +
                (error?.body?.message || error?.message || 'Unknown error');
            this.isLoading = false;
        }
    }

    // ----------------------------
    // Template state
    // ----------------------------
    get hasError() {
        return this.errorMessage !== '';
    }

    get hasAnalysis() {
        return !this.isLoading && !this.hasError && this.parsedAnalysis !== null;
    }

    // ✅ disable button if no related opportunity id
    get isOppButtonDisabled() {
        return !this.relatedOpportunityId;
    }

    get isOppSaveDisabled() {
        return this.isOppModalLoading || !this.relatedOpportunityId;
    }

    // ----------------------------
    // High-level fields
    // ----------------------------
    get executiveSummary() {
        return this.parsedAnalysis?.executive_summary || '';
    }

    get overallSentiment() {
        const score = this.parsedAnalysis?.overall_sentiment_score ?? 50;
        if (score >= 70) return 'Positive';
        if (score >= 40) return 'Neutral';
        return 'Negative';
    }

    get sentimentLevel() {
        const score = this.parsedAnalysis?.overall_sentiment_score ?? 50;
        if (score >= 70) return 'positive';
        if (score >= 40) return 'neutral';
        return 'negative';
    }

    get dealHealthScore() {
        return this.parsedAnalysis?.deal_health_score ?? 0;
    }

    get callOutcome() {
        return this.parsedAnalysis?.call_outcome_classification || 'N/A';
    }

    get stageRecommendation() {
        const rec = this.parsedAnalysis?.stage_recommendation || 'N/A';
        return rec ? rec.charAt(0).toUpperCase() + rec.slice(1) : 'N/A';
    }

    // ----------------------------
    // Sentiment timeline
    // ----------------------------
    get sentimentBeginning() {
        return this.parsedAnalysis?.sentiment_beginning_score ?? 0;
    }
    get sentimentMiddle() {
        return this.parsedAnalysis?.sentiment_middle_score ?? 0;
    }
    get sentimentEnd() {
        return this.parsedAnalysis?.sentiment_end_score ?? 0;
    }

    get sentimentBeginningStyle() {
        return this.getSentimentStyle(this.sentimentBeginning);
    }
    get sentimentMiddleStyle() {
        return this.getSentimentStyle(this.sentimentMiddle);
    }
    get sentimentEndStyle() {
        return this.getSentimentStyle(this.sentimentEnd);
    }

    getSentimentStyle(scoreRaw) {
        const score = Number(scoreRaw) || 0;
        let bgColor;
        if (score >= 70) bgColor = '#2e844a';
        else if (score >= 50) bgColor = '#f2a007';
        else if (score >= 30) bgColor = '#fe9339';
        else bgColor = '#ea001e';

        const width = Math.max(0, Math.min(100, score));
        return `background-color: ${bgColor}; width: ${width}%`;
    }

    get emotionalTones() {
        return this.parsedAnalysis?.emotional_tones || [];
    }

    // ----------------------------
    // Customer context
    // ----------------------------
    get customerPains() {
        return this.parsedAnalysis?.customer_pains || [];
    }

    get desiredOutcomes() {
        return this.parsedAnalysis?.desired_outcomes || [];
    }

    get successCriteria() {
        return this.parsedAnalysis?.success_criteria || [];
    }

    // ----------------------------
    // Buying signals & objections
    // ----------------------------
    get buyingSignalsWithStrength() {
        const signals = this.parsedAnalysis?.buying_signals || [];
        const strengths = this.parsedAnalysis?.buying_signal_strength_scores || [];

        return signals.map((signal, index) => {
            const strength = Number(strengths[index]) || 3;
            const pct = Math.max(0, Math.min(5, strength)) * 20;
            return {
                text: signal,
                strength,
                strengthStyle: `width: ${pct}%`
            };
        });
    }

    get buyingSignalsCount() {
        return this.parsedAnalysis?.buying_signals?.length || 0;
    }

    get objectionsWithSeverity() {
        const objections = this.parsedAnalysis?.objections || [];
        const severities = this.parsedAnalysis?.objection_severity_scores || [];

        return objections.map((objection, index) => {
            const severity = Number(severities[index]) || 3;
            let severityLevel = 'medium';
            if (severity >= 4) severityLevel = 'high';
            else if (severity <= 2) severityLevel = 'low';

            return {
                text: objection,
                severity,
                severityLevel
            };
        });
    }

    get objectionsCount() {
        return this.parsedAnalysis?.objections?.length || 0;
    }

    // ----------------------------
    // Decision making
    // ----------------------------
    get decisionRoles() {
        return this.parsedAnalysis?.decision_roles || 'Not specified';
    }
    get decisionTimeline() {
        return this.parsedAnalysis?.decision_timeline || 'Not specified';
    }
    get decisionBudget() {
        return this.parsedAnalysis?.decision_budget || 'Not specified';
    }
    get decisionProcurement() {
        return this.parsedAnalysis?.decision_procurement || 'Not specified';
    }

    // ----------------------------
    // Action Items
    // ----------------------------
    processActionItems() {
        const items = this.parsedAnalysis?.action_items || [];
        const owners = this.parsedAnalysis?.action_item_owners || [];
        const dueDates = this.parsedAnalysis?.action_item_due_dates || [];

        this.actionItemsData = items.map((item, index) => ({
            id: `action-${index}`,
            text: item,
            owner: owners[index] && owners[index] !== 'TBD' ? owners[index] : null,
            dueDate: dueDates[index] && dueDates[index] !== 'TBD' ? dueDates[index] : null,
            checked: false
        }));
    }

    get actionItems() {
        return this.actionItemsData || [];
    }

    get actionItemsCount() {
        return this.actionItems.length;
    }

    get selectedActionCount() {
        return this.selectedActions.size;
    }

    get isCreateDisabled() {
        return this.selectedActions.size === 0;
    }

    // ----------------------------
    // Risks / Competitors / Missing Info
    // ----------------------------
    get risks() {
        return this.parsedAnalysis?.risks_red_flags || [];
    }

    get competitors() {
        return this.parsedAnalysis?.competitors_mentioned || [];
    }

    get hasCompetitors() {
        return (this.competitors || []).length > 0;
    }

    get competitiveNotes() {
        return this.parsedAnalysis?.competitive_notes || '';
    }

    get missingInfo() {
        return this.parsedAnalysis?.missing_info || [];
    }

    get hasMissingInfo() {
        return (this.missingInfo || []).length > 0;
    }

    // ----------------------------
    // UI handlers (existing)
    // ----------------------------
    handleActionToggle(event) {
        const actionId = event.target.dataset.id;
        const isChecked = event.target.checked;

        const next = new Set(this.selectedActions);
        isChecked ? next.add(actionId) : next.delete(actionId);
        this.selectedActions = next;

        this.actionItemsData = (this.actionItemsData || []).map((a) =>
            a.id === actionId ? { ...a, checked: isChecked } : a
        );
    }

    handleCreateTasks() {
        const selectedActionTexts = (this.actionItems || [])
            .filter((action) => this.selectedActions.has(action.id))
            .map((action) => action.text);

        if (selectedActionTexts.length === 0) return;

        this.dispatchEvent(
            new ShowToastEvent({
                title: 'Tasks Created',
                message: `${selectedActionTexts.length} task(s) created successfully`,
                variant: 'success'
            })
        );

        this.selectedActions = new Set();
        this.actionItemsData = (this.actionItemsData || []).map((a) => ({ ...a, checked: false }));
    }

    // ----------------------------
    // ✅ NEW: Opportunity modal flow
    // ----------------------------
    async handleOpenOppModal() {
        if (!this.relatedOpportunityId) {
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'No related Opportunity',
                    message: 'This VideoCall record does not have RelatedRecordId populated.',
                    variant: 'error'
                })
            );
            return;
        }

        this.isOppModalOpen = true;
        this.isOppModalLoading = true;

        // Reset draft each time modal opens (so users see fresh suggestions)
        this.oppDraftDescription = '';
        this.oppDraftStageName = '';
        this.oppDraftCloseDate = '';
        this.oppDraftNextStep = '';

        try {
            const jsonString = await runOppAnalysis({ videoCallId: this.recordId });

            let parsed;
            try {
                parsed = JSON.parse(jsonString || '{}');
            } catch (e) {
                throw new Error(`Apex returned non-JSON text. ${e?.message || e}`);
            }

            // Map JSON keys to Opportunity fields
            this.oppDraftDescription = parsed?.Description || '';
            this.oppDraftStageName = parsed?.StageName || '';
            this.oppDraftCloseDate = parsed?.CloseDate || ''; // expect yyyy-mm-dd
            this.oppDraftNextStep = parsed?.NextSteps || ''; // JSON uses NextSteps, Opportunity uses NextStep
        } catch (e) {
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Failed to load suggestions',
                    message: e?.body?.message || e?.message || 'Unknown error',
                    variant: 'error'
                })
            );
        } finally {
            this.isOppModalLoading = false;
        }
    }

    handleCloseOppModal() {
        this.isOppModalOpen = false;
    }

    handleOppDraftChange(event) {
        const field = event.target.dataset.field;
        const value = event.target.value;

        if (field === 'Description') this.oppDraftDescription = value;
        else if (field === 'StageName') this.oppDraftStageName = value;
        else if (field === 'CloseDate') this.oppDraftCloseDate = value;
        else if (field === 'NextStep') this.oppDraftNextStep = value;
    }

    async handleSaveOpportunity() {
        if (!this.relatedOpportunityId) return;

        try {
            this.isOppModalLoading = true;

            const fields = {};
            fields[OPP_ID_FIELD.fieldApiName] = this.relatedOpportunityId;

            // Only set values if present (prevents overwriting with blanks unintentionally)
            if (this.oppDraftDescription !== undefined) fields[OPP_DESCRIPTION_FIELD.fieldApiName] = this.oppDraftDescription;
            if (this.oppDraftStageName !== undefined) fields[OPP_STAGENAME_FIELD.fieldApiName] = this.oppDraftStageName;
            if (this.oppDraftCloseDate !== undefined) fields[OPP_CLOSEDATE_FIELD.fieldApiName] = this.oppDraftCloseDate;
            if (this.oppDraftNextStep !== undefined) fields[OPP_NEXTSTEP_FIELD.fieldApiName] = this.oppDraftNextStep;

            await updateRecord({ fields });

            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Opportunity Updated',
                    message: 'Opportunity fields were updated successfully.',
                    variant: 'success'
                })
            );

            this.isOppModalOpen = false;
        } catch (e) {
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Update Failed',
                    message: e?.body?.message || e?.message || 'Unknown error',
                    variant: 'error'
                })
            );
        } finally {
            this.isOppModalLoading = false;
        }
    }
}