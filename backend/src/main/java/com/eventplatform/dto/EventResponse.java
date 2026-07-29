package com.eventplatform.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EventResponse {
    private String id;
    private String title;
    private String description;
    private LocalDateTime date;
    private String location;
    private String organizerId;
    private String organizerName;
    private Integer totalCapacity;
    private Integer availableTickets;
}
