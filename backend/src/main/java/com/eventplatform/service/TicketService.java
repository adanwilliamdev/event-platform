package com.eventplatform.service;

import com.eventplatform.dto.TicketAvailabilityUpdate;
import com.eventplatform.dto.TicketHoldRequest;
import com.eventplatform.dto.TicketHoldResponse;
import com.eventplatform.dto.TicketResponse;
import com.eventplatform.entity.Ticket;
import com.eventplatform.entity.TicketStatus;
import com.eventplatform.entity.User;
import com.eventplatform.exception.TicketNotAvailableException;
import com.eventplatform.repository.TicketRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.OptimisticLockingFailureException;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.retry.annotation.Backoff;
import org.springframework.retry.annotation.Retryable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class TicketService {
    private final TicketRepository ticketRepository;
    private final RedisTemplate<String, Object> redisTemplate;
    private final SimpMessagingTemplate messagingTemplate;
    
    private static final String TICKET_HOLD_KEY = "ticket:hold:";
    private static final int HOLD_DURATION_MINUTES = 10;
    
    @Transactional
    @Retryable(
        value = OptimisticLockingFailureException.class,
        maxAttempts = 3,
        backoff = @Backoff(delay = 100)
    )
    public TicketHoldResponse holdTicket(TicketHoldRequest request, User user) {
        log.info("Attempting to hold ticket: {} for user: {}", request.getTicketId(), user.getId());
        
        Ticket ticket = ticketRepository.findByIdWithPessimisticLock(request.getTicketId())
            .orElseThrow(() -> new TicketNotAvailableException("Ticket not found"));
        
        if (ticket.getStatus() != TicketStatus.AVAILABLE) {
            throw new TicketNotAvailableException("Ticket is not available. Current status: " + ticket.getStatus());
        }
        
        ticket.setStatus(TicketStatus.RESERVED);
        ticket.setReservedAt(LocalDateTime.now());
        ticket.setReservedBy(user.getId());
        
        Ticket savedTicket = ticketRepository.save(ticket);
        
        String holdKey = TICKET_HOLD_KEY + savedTicket.getId();
        redisTemplate.opsForValue().set(
            holdKey, 
            user.getId(), 
            HOLD_DURATION_MINUTES, 
            TimeUnit.MINUTES
        );
        
        log.info("Ticket {} held successfully for user: {}", savedTicket.getId(), user.getId());

        broadcastAvailability(savedTicket);
        
        return TicketHoldResponse.builder()
            .ticketId(savedTicket.getId())
            .seatNumber(savedTicket.getSeatNumber())
            .price(savedTicket.getPrice())
            .holdExpiration(LocalDateTime.now().plus(HOLD_DURATION_MINUTES, ChronoUnit.MINUTES))
            .build();
    }
    
    @Transactional
    public void confirmTicketSale(String ticketId, String orderId) {
        log.info("Confirming ticket sale: {} for order: {}", ticketId, orderId);
        
        Ticket ticket = ticketRepository.findByIdWithPessimisticLock(ticketId)
            .orElseThrow(() -> new TicketNotAvailableException("Ticket not found"));
        
        if (ticket.getStatus() != TicketStatus.RESERVED) {
            throw new IllegalStateException("Ticket must be reserved before sale");
        }
        
        ticket.setStatus(TicketStatus.SOLD);
        Ticket savedTicket = ticketRepository.save(ticket);
        
        String holdKey = TICKET_HOLD_KEY + ticketId;
        redisTemplate.delete(holdKey);
        
        log.info("Ticket {} sold successfully", ticketId);

        broadcastAvailability(savedTicket);
    }
    
    public List<TicketResponse> getAvailableTickets(String eventId) {
        return ticketRepository.findByEventIdAndStatus(eventId, TicketStatus.AVAILABLE).stream()
            .map(t -> TicketResponse.builder()
                .id(t.getId())
                .seatNumber(t.getSeatNumber())
                .price(t.getPrice())
                .status(t.getStatus().name())
                .build())
            .collect(Collectors.toList());
    }

    @Transactional
    public void releaseTicketHold(String ticketId) {
        log.info("Releasing ticket hold: {}", ticketId);
        
        Ticket ticket = ticketRepository.findByIdWithPessimisticLock(ticketId)
            .orElseThrow(() -> new TicketNotAvailableException("Ticket not found"));
        
        if (ticket.getStatus() == TicketStatus.RESERVED) {
            ticket.setStatus(TicketStatus.AVAILABLE);
            ticket.setReservedAt(null);
            ticket.setReservedBy(null);
            Ticket savedTicket = ticketRepository.save(ticket);
            
            String holdKey = TICKET_HOLD_KEY + ticketId;
            redisTemplate.delete(holdKey);
            
            log.info("Ticket hold released: {}", ticketId);

            broadcastAvailability(savedTicket);
        }
    }

    private void broadcastAvailability(Ticket ticket) {
        try {
            long availableCount = ticketRepository.countAvailableTickets(ticket.getEvent().getId(), TicketStatus.AVAILABLE);

            TicketAvailabilityUpdate update = TicketAvailabilityUpdate.builder()
                .eventId(ticket.getEvent().getId())
                .ticketId(ticket.getId())
                .seatNumber(ticket.getSeatNumber())
                .status(ticket.getStatus().name())
                .availableCount(availableCount)
                .build();

            messagingTemplate.convertAndSend("/topic/events/" + ticket.getEvent().getId() + "/tickets", update);
        } catch (Exception e) {
            log.error("Failed to broadcast ticket availability update", e);
        }
    }
}
