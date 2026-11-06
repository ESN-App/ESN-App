using EsnApp.Application.Common;
using MediatR;

namespace EsnApp.Application.Identity;

public record CreateAdminRequest(string Email, string Password, string FirstName, string LastName)
    : IRequest<Result<AdminUserDto>>;

public record LoginRequest(string Email, string Password);

public record AuthResponse(string Token, DateTimeOffset ExpiresAt, string Email);

public record AdminUserDto(string Id, string Email, string FirstName, string LastName, DateTimeOffset CreatedAt);

public record ResetPasswordRequest(string Email, string Token, string NewPassword);
