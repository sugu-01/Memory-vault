package com.memoryvault.exception;

public class ForbiddenException extends RuntimeException {
    public ForbiddenException(String message) {
        super(message);
    }
    public ForbiddenException() {
        super("Access denied: you do not have permission to access this resource");
    }
}
