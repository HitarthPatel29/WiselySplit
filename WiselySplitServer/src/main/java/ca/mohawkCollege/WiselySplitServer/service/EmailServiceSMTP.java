package ca.mohawkCollege.WiselySplitServer.service;

import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class EmailServiceSMTP {

    private final JavaMailSender mailSender;

    public EmailServiceSMTP(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    /** Send a simple plain-text email */
    public void sendEmail(String to, String subject, String body) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(to);
        message.setSubject(subject);
        message.setText(body);
        message.setFrom("wiselysplit.noreply@wiselysplit.com"); // change if needed
        mailSender.send(message);
    }
}