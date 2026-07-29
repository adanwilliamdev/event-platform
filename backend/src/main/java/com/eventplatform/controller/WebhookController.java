package com.eventplatform.controller;

import com.eventplatform.service.OrderService;
import com.stripe.model.Event;
import com.stripe.model.PaymentIntent;
import com.stripe.net.Webhook;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/webhooks/stripe")
@RequiredArgsConstructor
@Slf4j
public class WebhookController {
    private final OrderService orderService;
    
    @Value("${stripe.webhook-secret}")
    private String webhookSecret;
    
    @PostMapping
    public ResponseEntity<String> handleWebhook(
            @RequestBody String payload,
            @RequestHeader("Stripe-Signature") String sigHeader) {
        
        try {
            Event event = Webhook.constructEvent(payload, sigHeader, webhookSecret);
            log.info("Received webhook event: {}", event.getType());
            
            if ("payment_intent.succeeded".equals(event.getType())) {
                PaymentIntent paymentIntent = (PaymentIntent) event.getData().getObject();
                orderService.processSuccessfulPayment(paymentIntent.getId());
            } else if ("payment_intent.payment_failed".equals(event.getType())) {
                PaymentIntent paymentIntent = (PaymentIntent) event.getData().getObject();
                log.warn("Payment failed: {}", paymentIntent.getId());
            }
            
            return ResponseEntity.ok("Webhook processed successfully");
        } catch (Exception e) {
            log.error("Webhook processing error", e);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Webhook processing failed");
        }
    }
}
