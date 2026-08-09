namespace EsnApp.Application.Identity;

public record RegisterRequest(string Email, string Password);

public record LoginRequest(string Email, string Password);

public record AuthResponse(string Token, DateTimeOffset ExpiresAt, string Email);

public record AdminUserDto(string Id, string Email, DateTimeOffset CreatedAt);
