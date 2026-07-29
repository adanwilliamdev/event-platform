package com.eventplatform.repository;

import com.eventplatform.entity.Ticket;
import com.eventplatform.entity.TicketStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import jakarta.persistence.LockModeType;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface TicketRepository extends JpaRepository<Ticket, String> {
    List<Ticket> findByEventIdAndStatus(String eventId, TicketStatus status);
    
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT t FROM Ticket t WHERE t.id = :id")
    Optional<Ticket> findByIdWithPessimisticLock(@Param("id") String id);
    
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT t FROM Ticket t WHERE t.event.id = :eventId AND t.seatNumber = :seatNumber AND t.status = :status")
    Optional<Ticket> findByEventIdAndSeatNumberWithLock(
        @Param("eventId") String eventId, 
        @Param("seatNumber") String seatNumber,
        @Param("status") TicketStatus status
    );
    
    @Lock(LockModeType.OPTIMISTIC)
    @Query("SELECT t FROM Ticket t WHERE t.id = :id")
    Optional<Ticket> findByIdWithOptimisticLock(@Param("id") String id);
    
    @Query("SELECT COUNT(t) FROM Ticket t WHERE t.event.id = :eventId AND t.status = :status")
    long countAvailableTickets(@Param("eventId") String eventId, @Param("status") TicketStatus status);
    
    @Query("SELECT t FROM Ticket t WHERE t.status = 'RESERVED' AND t.reservedAt < :expirationTime")
    List<Ticket> findReservedTicketsOlderThan(@Param("expirationTime") LocalDateTime expirationTime);
}
