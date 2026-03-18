public with sharing class VideoCallOpportunityUpdateController {
    @AuraEnabled(cacheable=false)
    public static String runAnalysis(Id videoCallId) {
        if (videoCallId == null) {
            throw new AuraHandledException('videoCallId is required');
        }
        // Calls your existing logic
        String result = AI_opportunityUpdateFromECI.runAnalysis(videoCallId);
        return result;
    }
}