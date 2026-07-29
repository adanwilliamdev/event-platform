package com.eventplatform.exception;

public class TicketNotAvailableException extends RuntimeException {
    public TicketNotAvailableException(String message) {
        super(message);
    }
}
