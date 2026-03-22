package com.research.assistant;


import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.Map;

@Service
public class ResearchService {

    @Value("${gemini.api.url}")
    private String geminiApiUrl;

    @Value("${gemini.api.key}")
    private String geminiApiKey;

    private final WebClient webClient;
    private final ObjectMapper objectMapper;



    public ResearchService(WebClient.Builder webClientBuilder, ObjectMapper objectMapper) {
        this.webClient = webClientBuilder.build();
        this.objectMapper=objectMapper;
    }


    public String processContent(ResearchRequest request) {
        //prompt
        String prompt=buildPrompt(request);

        //query the ai model
        Map <String, Object> requestBody= Map.of(
                "contents" , new Object[] {
                        Map.of("parts", new Object[]{
                                Map.of("text", prompt)
                        })
                }
        );
        String response= webClient.post()
                .uri(geminiApiUrl + geminiApiKey)
                .bodyValue(requestBody)
                .retrieve()
                .bodyToMono(String.class)
                .block();

        //parse the response


        //return response

        return extractTextFromResponse(response);
        }

        private String  extractTextFromResponse(String response){
        if (response == null || response.isBlank()) {
            return "no content found";
        }
        try {
            GeminiResponse geminiResponse= objectMapper.readValue(response, GeminiResponse.class);
            if(geminiResponse.getCandidates() != null && !geminiResponse.getCandidates().isEmpty()){
                GeminiResponse.Candidate firstCandidate = geminiResponse.getCandidates().get(0);

                if(firstCandidate.getContent()!=null &&
                firstCandidate.getContent().getParts()!=null &&
                        !firstCandidate.getContent().getParts().isEmpty()){
                    return firstCandidate.getContent().getParts().get(0).getText();

                }
            }
            return "no content found";
        } catch (Exception e) {
            return "Error Parsing: " + e.getMessage();
        }
        }

    private String buildPrompt(ResearchRequest request){
        if (request == null || request.getOperation() == null) {
            throw new IllegalArgumentException("Operation is required");
        }
        StringBuilder prompt=new StringBuilder();

        switch (request.getOperation()){

            case "summarize" :
                prompt.append("Summarize the following text in a clear and concise way. Focus on the main ideas and key points, and avoid unnecessary details.");
                break;

            case "suggest"   :
                prompt.append("Review the following text and provide suggestions to improve clarity, structure, and readability. Point out any weak areas and suggest better alternatives.");
                break;

            default :
                throw new IllegalArgumentException("Unknown Operation: " + request.getOperation());
        }

        prompt.append("\n\n");
        prompt.append(request.getContent());
        return prompt.toString();
    }
}
