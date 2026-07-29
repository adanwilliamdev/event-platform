package com.eventplatform.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "tickets", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"event_id", "seat_number"})
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Ticket {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;
    
    @ManyToOne
    @JoinColumn(name = "event_id", nullable = false)
    private Event event;
    
    @Column(name = "seat_number", nullable = false)
    private String seatNumber;
    
    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal price;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TicketStatus status;
    
    @ManyToOne
    @JoinColumn(name = "order_id")
    private Order order;
    
    @Column(name = "reserved_at")
    private LocalDateTime reservedAt;
    
    @Column(name = "reserved_by")
    private String reservedBy;
    
    @Version
    @Column(name = "version")
    private Long version;
    
    @PrePersist
    protected void onCreate() {
        if (status == null) {
            status = TicketStatus.AVAILABLE;
        }
    }
}
