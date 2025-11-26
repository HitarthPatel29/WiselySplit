package ca.mohawkCollege.WiselySplitServer.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;

@Service
public class EmailServiceMailTrapAPI {

    @Value("${mailtrap.api_key}")
    private String apiToken;

    @Value("${mailtrap.sender_email}")
    private String senderEmail;

    @Value("${mailtrap.sender_name}")
    private String senderName;

    @Value("${mailtrap.api_url}")
    private String apiURL;

    private final RestTemplate restTemplate = new RestTemplate();

    public void sendEmail(String to, String subject, String body) {

        Map<String, Object> payload = Map.of(
                "from", Map.of(
                        "email", senderEmail,
                        "name", senderName
                ),
                "to", new Object[]{
                        Map.of("email", to)
                },
                "subject", subject,
                "text", body,
                "category", "WiselySplit Sandbox Email"
        );

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setAccept(List.of(MediaType.APPLICATION_JSON));
        headers.setBearerAuth(apiToken);

        HttpEntity<Object> entity = new HttpEntity<>(payload, headers);

        try {
            ResponseEntity<String> res = restTemplate.exchange(
                    apiURL,
                    HttpMethod.POST,
                    entity,
                    String.class
            );

            System.out.println("Mailtrap Response: " + res.getBody());
        } catch (Exception e) {
            System.err.println("Mailtrap Error: " + e.getMessage());
            throw new RuntimeException(e);
        }
    }
}