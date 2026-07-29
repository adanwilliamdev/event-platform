package com.eventplatform.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TicketConfirmationMessage {
    private String orderId;
    private String userId;
    private String userEmail;
    private String userName;
    private BigDecimal totalAmount;
    private List<String> ticketSeats;
    private String eventTitle;
    private LocalDateTime eventDate;
}
