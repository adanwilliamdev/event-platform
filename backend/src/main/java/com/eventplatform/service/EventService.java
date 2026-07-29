package com.eventplatform.service;

import com.eventplatform.dto.EventRequest;
import com.eventplatform.dto.EventResponse;
import com.eventplatform.entity.Event;
import com.eventplatform.entity.Ticket;
import com.eventplatform.entity.TicketStatus;
import com.eventplatform.entity.User;
import com.eventplatform.repository.EventRepository;
import com.eventplatform.repository.TicketRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class EventService {
    private final EventRepository eventRepository;
    private final TicketRepository ticketRepository;

    @Transactional
    public EventResponse createEvent(EventRequest request, User organizer) {
        Event event = Event.builder()
            .title(request.getTitle())
            .description(request.getDescription())
            .date(request.getDate())
            .location(request.getLocation())
            .organizer(organizer)
            .totalCapacity(request.getTotalCapacity())
            .availableTickets(request.getTotalCapacity())
            .build();
        
        Event savedEvent = eventRepository.save(event);

        List<Ticket> tickets = new ArrayList<>();
        for (int i = 1; i <= request.getTotalCapacity(); i++) {
            tickets.add(Ticket.builder()
                .event(savedEvent)
                .seatNumber("SEAT-" + i)
                .price(request.getTicketPrice())
                .status(TicketStatus.AVAILABLE)
                .build());
        }
        ticketRepository.saveAll(tickets);

        log.info("Event created: {} with {} tickets", savedEvent.getId(), tickets.size());
        
        return mapToResponse(savedEvent);
    }
    
    public List<EventResponse> getAllEvents() {
        return eventRepository.findAll().stream()
            .map(this::mapToResponse)
            .collect(Collectors.toList());
    }
    
    public List<EventResponse> getUpcomingEvents() {
        return eventRepository.findUpcomingEvents(java.time.LocalDateTime.now()).stream()
            .map(this::mapToResponse)
            .collect(Collectors.toList());
    }
    
    public EventResponse getEvent(String id) {
        Event event = eventRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Event not found"));
        return mapToResponse(event);
    }
    
    private EventResponse mapToResponse(Event event) {
        long availableTickets = ticketRepository.countAvailableTickets(event.getId(), TicketStatus.AVAILABLE);

        return EventResponse.builder()
            .id(event.getId())
            .title(event.getTitle())
            .description(event.getDescription())
            .date(event.getDate())
            .location(event.getLocation())
            .organizerId(event.getOrganizer().getId())
            .organizerName(event.getOrganizer().getName())
            .totalCapacity(event.getTotalCapacity())
            .availableTickets((int) availableTickets)
            .build();
    }
}
