package com.eventplatform.service;

import com.eventplatform.dto.TicketConfirmationMessage;
import com.eventplatform.entity.Order;
import com.eventplatform.entity.OrderItem;
import com.eventplatform.entity.Ticket;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class MessageQueueService {
    private final RabbitTemplate rabbitTemplate;
    
    @Value("${app.rabbitmq.exchange}")
    private String exchange;

    @Value("${app.rabbitmq.routing-key}")
    private String routingKey;
    
    public void sendTicketConfirmation(Order order) {
        try {
            TicketConfirmationMessage message = TicketConfirmationMessage.builder()
                .orderId(order.getId())
                .userId(order.getUser().getId())
                .userEmail(order.getUser().getEmail())
                .userName(order.getUser().getName())
                .totalAmount(order.getTotalAmount())
                .ticketSeats(order.getOrderItems().stream()
                    .map(OrderItem::getTicket)
                    .map(Ticket::getSeatNumber)
                    .collect(Collectors.toList()))
                .eventTitle(order.getOrderItems().get(0).getTicket().getEvent().getTitle())
                .eventDate(order.getOrderItems().get(0).getTicket().getEvent().getDate())
                .build();
            
            rabbitTemplate.convertAndSend(exchange, routingKey, message);
            log.info("Ticket confirmation message sent for order: {}", order.getId());
        } catch (Exception e) {
            log.error("Failed to send ticket confirmation message", e);
        }
    }
}
