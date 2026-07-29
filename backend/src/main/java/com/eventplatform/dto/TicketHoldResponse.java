package com.eventplatform.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TicketHoldResponse {
    private String ticketId;
    private String seatNumber;
    private BigDecimal price;
    private LocalDateTime holdExpiration;
}
