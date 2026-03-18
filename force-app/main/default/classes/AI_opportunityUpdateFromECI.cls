public without sharing class AI_opportunityUpdateFromECI {

    @AuraEnabled(cacheable=false)
    public static String runAnalysis(String videoCallId) {
        if (String.isBlank(videoCallId)) {
            return 'Error: videoCallId is required.';
        }

        try {
            VideoCall vc = [
                SELECT RelatedRecordId
                FROM VideoCall
                WHERE Id = :videoCallId
                LIMIT 1
            ];

            if (vc.RelatedRecordId == null) {
                return 'Error: VideoCall has no RelatedRecordId.';
            }

            if (vc.RelatedRecordId.getSObjectType() != Opportunity.SObjectType) {
                 return 'Error: Related record is not an Opportunity.';
            }

            ConnectApi.EinsteinPromptTemplateGenerationsInput promptInput = new ConnectApi.EinsteinPromptTemplateGenerationsInput();
            promptInput.isPreview = false;

            promptInput.inputParams = new Map<String, ConnectApi.WrappedValue>{
                'Input:VideoCall'     => wrapId(videoCallId),
                'Input:Opportunity'   => wrapId((String)vc.RelatedRecordId)
            };

            promptInput.additionalConfig = new ConnectApi.EinsteinLlmAdditionalConfigInput();
            promptInput.additionalConfig.applicationName = 'PromptTemplateGenerationsInvocable';

            ConnectApi.EinsteinPromptTemplateGenerationsRepresentation result =
                ConnectApi.EinsteinLLM.generateMessagesForPromptTemplate(
                    'Opportunity_Update_Recommendation_ECI',
                    promptInput
                );

            if (result == null || result.generations == null || result.generations.isEmpty()) {
                return 'Error: No generations returned from Einstein.';
            }

            String text = result.generations[0].text;
            return String.isBlank(text) ? 'Error: Empty response from Einstein.' : text;

        } catch (Exception e) {
            // Prefer not exposing internals to the UI:
            System.debug(LoggingLevel.ERROR, 'Error calling Einstein: ' + e);
            return 'Error: Unable to run analysis.';
            // Or if you want a handled exception for Lightning:
            // throw new AuraHandledException('Unable to run analysis.');
        }
    }

    private static ConnectApi.WrappedValue wrapId(String idVal) {
        Map<String, String> m = new Map<String, String>{ 'id' => idVal };
        ConnectApi.WrappedValue w = new ConnectApi.WrappedValue();
        w.value = m;
        return w;
    }
}