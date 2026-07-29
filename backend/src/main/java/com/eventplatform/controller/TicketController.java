package com.eventplatform.controller;

import com.eventplatform.dto.TicketHoldRequest;
import com.eventplatform.dto.TicketHoldResponse;
import com.eventplatform.entity.User;
import com.eventplatform.service.TicketService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/tickets")
@RequiredArgsConstructor
public class TicketController {

    private final TicketService ticketService;

    @PostMapping("/hold")
    public ResponseEntity<TicketHoldResponse> holdTicket(
            @Valid @RequestBody TicketHoldRequest request,
            @AuthenticationPrincipal User user
    ) {
        TicketHoldResponse response = ticketService.holdTicket(request, user);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{id}/release")
    public ResponseEntity<Void> releaseTicket(@PathVariable String id) {
        ticketService.releaseTicketHold(id);
        return ResponseEntity.noContent().build();
    }
}
