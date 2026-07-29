package com.eventplatform.service;

import com.eventplatform.dto.TicketConfirmationMessage;
import com.eventplatform.util.QRCodeGenerator;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import jakarta.mail.internet.MimeMessage;

@Service
@RequiredArgsConstructor
@Slf4j
public class TicketConfirmationConsumer {
    private final JavaMailSender mailSender;
    private final QRCodeGenerator qrCodeGenerator;
    
    @RabbitListener(queues = "${app.rabbitmq.queue}")
    public void processTicketConfirmation(TicketConfirmationMessage message) {
        log.info("Processing ticket confirmation for order: {}", message.getOrderId());
        
        try {
            sendConfirmationEmail(message);
            log.info("Ticket confirmation email sent for order: {}", message.getOrderId());
        } catch (Exception e) {
            log.error("Failed to send ticket confirmation email", e);
        }
    }
    
    private void sendConfirmationEmail(TicketConfirmationMessage message) throws Exception {
        MimeMessage mimeMessage = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, true);
        helper.setTo(message.getUserEmail());
        helper.setSubject("Ticket Confirmation - " + message.getEventTitle());
        
        byte[] qrCode = qrCodeGenerator.generateQRCode(
            String.format("Order: %s, Seats: %s", 
                message.getOrderId(), 
                String.join(", ", message.getTicketSeats()))
        );
        
        String htmlContent = String.format("""
            <html>
            <body>
                <h2>🎫 Ticket Confirmation</h2>
                <p>Dear %s,</p>
                <p>Your tickets for <strong>%s</strong> have been confirmed!</p>
                <p><strong>Event Date:</strong> %s</p>
                <p><strong>Seats:</strong> %s</p>
                <p><strong>Order ID:</strong> %s</p>
                <p><strong>Total Paid:</strong> $%.2f</p>
                <p>Scan the QR code below at the event entrance:</p>
                <img src="data:image/png;base64,%s" alt="QR Code"/>
                <br/>
                <p>Thank you for your purchase!</p>
            </body>
            </html>
            """,
            message.getUserName(),
            message.getEventTitle(),
            message.getEventDate().toString(),
            String.join(", ", message.getTicketSeats()),
            message.getOrderId(),
            message.getTotalAmount().doubleValue(),
            java.util.Base64.getEncoder().encodeToString(qrCode)
        );
        
        helper.setText(htmlContent, true);
        mailSender.send(mimeMessage);
    }
}
