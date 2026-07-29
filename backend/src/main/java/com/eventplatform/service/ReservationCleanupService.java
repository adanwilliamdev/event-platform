package com.eventplatform.service;

import com.eventplatform.entity.Ticket;
import com.eventplatform.repository.TicketRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class ReservationCleanupService {
    private final TicketRepository ticketRepository;
    private final TicketService ticketService;
    
    private static final int HOLD_DURATION_MINUTES = 10;
    
    @Scheduled(fixedDelay = 60000)
    @Transactional
    public void cleanupExpiredReservations() {
        log.debug("Running reservation cleanup job");
        
        LocalDateTime expirationTime = LocalDateTime.now().minusMinutes(HOLD_DURATION_MINUTES);
        
        List<Ticket> expiredReservations = ticketRepository.findReservedTicketsOlderThan(expirationTime);
        
        for (Ticket ticket : expiredReservations) {
            try {
                ticketService.releaseTicketHold(ticket.getId());
                log.info("Released expired reservation for ticket: {}", ticket.getId());
            } catch (Exception e) {
                log.error("Failed to release expired reservation for ticket: {}", ticket.getId(), e);
            }
        }
    }
}
