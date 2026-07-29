package com.eventplatform.service;

import com.eventplatform.dto.OrderRequest;
import com.eventplatform.dto.OrderResponse;
import com.eventplatform.entity.*;
import com.eventplatform.exception.OrderProcessingException;
import com.eventplatform.repository.OrderRepository;
import com.eventplatform.repository.TicketRepository;
import com.stripe.Stripe;
import com.stripe.model.PaymentIntent;
import com.stripe.param.PaymentIntentCreateParams;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class OrderService {
    private final OrderRepository orderRepository;
    private final TicketRepository ticketRepository;
    private final TicketService ticketService;
    private final MessageQueueService messageQueueService;
    
    @Value("${stripe.api-key}")
    private String stripeApiKey;
    
    @Transactional
    public OrderResponse createOrder(OrderRequest request, User user) {
        log.info("Creating order for user: {}", user.getId());
        
        List<Ticket> tickets = new ArrayList<>();
        BigDecimal totalAmount = BigDecimal.ZERO;
        
        for (String ticketId : request.getTicketIds()) {
            Ticket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new OrderProcessingException("Ticket not found: " + ticketId));
            
            if (ticket.getStatus() != TicketStatus.RESERVED || 
                !ticket.getReservedBy().equals(user.getId())) {
                throw new OrderProcessingException("Ticket not reserved for this user: " + ticketId);
            }
            
            tickets.add(ticket);
            totalAmount = totalAmount.add(ticket.getPrice());
        }
        
        Order order = Order.builder()
            .user(user)
            .totalAmount(totalAmount)
            .status(OrderStatus.PENDING)
            .build();

        List<OrderItem> orderItems = new ArrayList<>();
        for (Ticket ticket : tickets) {
            orderItems.add(OrderItem.builder()
                .order(order)
                .ticket(ticket)
                .price(ticket.getPrice())
                .build());
        }
        order.setOrderItems(orderItems);
        
        Order savedOrder = orderRepository.save(order);
        
        Stripe.apiKey = stripeApiKey;
        
        try {
            PaymentIntentCreateParams params = PaymentIntentCreateParams.builder()
                .setAmount(totalAmount.multiply(BigDecimal.valueOf(100)).longValue())
                .setCurrency("usd")
                .putMetadata("orderId", savedOrder.getId())
                .putMetadata("userId", user.getId())
                .build();
            
            PaymentIntent paymentIntent = PaymentIntent.create(params);
            
            savedOrder.setStripePaymentIntent(paymentIntent.getId());
            orderRepository.save(savedOrder);
            
            log.info("Order created with Payment Intent: {}", paymentIntent.getId());
            
            return OrderResponse.builder()
                .orderId(savedOrder.getId())
                .totalAmount(totalAmount)
                .paymentIntentId(paymentIntent.getId())
                .clientSecret(paymentIntent.getClientSecret())
                .status(savedOrder.getStatus())
                .build();
                
        } catch (Exception e) {
            log.error("Failed to create Stripe payment intent", e);
            throw new OrderProcessingException("Failed to create payment intent: " + e.getMessage());
        }
    }
    
    public OrderResponse getOrder(String orderId, User user) {
        Order order = orderRepository.findById(orderId)
            .orElseThrow(() -> new OrderProcessingException("Order not found: " + orderId));

        if (!order.getUser().getId().equals(user.getId())) {
            throw new OrderProcessingException("Order does not belong to this user");
        }

        return mapToResponse(order);
    }

    public List<OrderResponse> getMyOrders(User user) {
        return orderRepository.findByUserIdOrderByCreatedAtDesc(user.getId()).stream()
            .map(this::mapToResponse)
            .toList();
    }

    private OrderResponse mapToResponse(Order order) {
        return OrderResponse.builder()
            .orderId(order.getId())
            .totalAmount(order.getTotalAmount())
            .paymentIntentId(order.getStripePaymentIntent())
            .status(order.getStatus())
            .build();
    }

    @Transactional
    public void processSuccessfulPayment(String paymentIntentId) {
        log.info("Processing successful payment: {}", paymentIntentId);
        
        Order order = orderRepository.findByStripePaymentIntent(paymentIntentId)
            .orElseThrow(() -> new OrderProcessingException("Order not found for payment intent: " + paymentIntentId));
        
        order.setStatus(OrderStatus.PAID);
        orderRepository.save(order);
        
        // Create order items
        for (Ticket ticket : order.getOrderItems().stream().map(OrderItem::getTicket).toList()) {
            ticketService.confirmTicketSale(ticket.getId(), order.getId());
        }
        
        messageQueueService.sendTicketConfirmation(order);
        
        log.info("Payment processed successfully for order: {}", order.getId());
    }
}
