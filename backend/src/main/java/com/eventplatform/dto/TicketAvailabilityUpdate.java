package com.eventplatform.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TicketAvailabilityUpdate {
    private String eventId;
    private String ticketId;
    private String seatNumber;
    private String status;
    private long availableCount;
}
