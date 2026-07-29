package com.eventplatform.controller;

import com.eventplatform.dto.EventRequest;
import com.eventplatform.dto.EventResponse;
import com.eventplatform.dto.TicketResponse;
import com.eventplatform.entity.User;
import com.eventplatform.service.EventService;
import com.eventplatform.service.TicketService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/events")
@RequiredArgsConstructor
public class EventController {

    private final EventService eventService;
    private final TicketService ticketService;

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'ORGANIZER')")
    public ResponseEntity<EventResponse> createEvent(
            @Valid @RequestBody EventRequest request,
            @AuthenticationPrincipal User organizer
    ) {
        EventResponse response = eventService.createEvent(request, organizer);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping
    public ResponseEntity<List<EventResponse>> getAllEvents() {
        return ResponseEntity.ok(eventService.getAllEvents());
    }

    @GetMapping("/upcoming")
    public ResponseEntity<List<EventResponse>> getUpcomingEvents() {
        return ResponseEntity.ok(eventService.getUpcomingEvents());
    }

    @GetMapping("/{id}")
    public ResponseEntity<EventResponse> getEvent(@PathVariable String id) {
        return ResponseEntity.ok(eventService.getEvent(id));
    }

    @GetMapping("/{id}/tickets")
    public ResponseEntity<List<TicketResponse>> getAvailableTickets(@PathVariable String id) {
        return ResponseEntity.ok(ticketService.getAvailableTickets(id));
    }
}
