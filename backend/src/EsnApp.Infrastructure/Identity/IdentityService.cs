using EsnApp.Application.Common;
using EsnApp.Application.Identity;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Options;

namespace EsnApp.Infrastructure.Identity;

public class IdentityService(
    UserManager<ApplicationUser> userManager,
    JwtTokenService tokenService,
    IEmailSender emailSender,
    IOptions<EmailSettings> emailOptions) : IIdentityService
{
    private readonly EmailSettings _emailSettings = emailOptions.Value;

    public async Task<Result<AuthResponse>> RegisterAsync(
        RegisterRequest request,
        CancellationToken cancellationToken = default)
    {
        var existing = await userManager.FindByEmailAsync(request.Email);

        if (existing is not null)
        {
            return Result.Failure<AuthResponse>("An account with this email already exists.");
        }

        var user = new ApplicationUser
        {
            UserName = request.Email,
            Email = request.Email,
        };

        var result = await userManager.CreateAsync(user, request.Password);

        if (!result.Succeeded)
        {
            return Result.Failure<AuthResponse>(
                string.Join(" ", result.Errors.Select(e => e.Description)));
        }

        return await BuildAuthResponseAsync(user);
    }

    public async Task<Result<AuthResponse>> LoginAsync(
        LoginRequest request,
        CancellationToken cancellationToken = default)
    {
        var user = await userManager.FindByEmailAsync(request.Email);

        if (user is null || !await userManager.CheckPasswordAsync(user, request.Password))
        {
            return Result.Failure<AuthResponse>("Invalid email or password.");
        }

        return await BuildAuthResponseAsync(user);
    }

    public async Task<Result<IReadOnlyList<AdminUserDto>>> GetAdminsAsync(
        CancellationToken cancellationToken = default)
    {
        var admins = await userManager.GetUsersInRoleAsync("Admin");

        return Result.Success<IReadOnlyList<AdminUserDto>>(
            admins
                .OrderByDescending(user => user.CreatedAt)
                .Select(user => new AdminUserDto(
                    user.Id,
                    user.Email ?? string.Empty,
                    user.CreatedAt))
                .ToList());
    }

    public async Task<Result<AdminUserDto>> CreateAdminAsync(
        CreateAdminRequest request,
        CancellationToken cancellationToken = default)
    {
        var existing = await userManager.FindByEmailAsync(request.Email);

        if (existing is not null)
        {
            return Result.Failure<AdminUserDto>("An account with this email already exists.");
        }

        var user = new ApplicationUser
        {
            UserName = request.Email,
            Email = request.Email,
        };

        var createResult = await userManager.CreateAsync(user, request.Password);

        if (!createResult.Succeeded)
        {
            return Result.Failure<AdminUserDto>(
                string.Join(" ", createResult.Errors.Select(e => e.Description)));
        }

        var roleResult = await userManager.AddToRoleAsync(user, "Admin");

        if (!roleResult.Succeeded)
        {
            return Result.Failure<AdminUserDto>(
                string.Join(" ", roleResult.Errors.Select(e => e.Description)));
        }

        return Result.Success(new AdminUserDto(user.Id, user.Email ?? string.Empty, user.CreatedAt));
    }

    public async Task<Result> DeleteAdminAsync(
        string id,
        string currentUserId,
        CancellationToken cancellationToken = default)
    {
        if (string.Equals(id, currentUserId, StringComparison.Ordinal))
        {
            return Result.Failure("You cannot delete your own account.");
        }

        var user = await userManager.FindByIdAsync(id);

        if (user is null)
        {
            return Result.Failure("Administrator not found.");
        }

        var admins = await userManager.GetUsersInRoleAsync("Admin");

        if (admins.Count <= 1)
        {
            return Result.Failure("At least one administrator account must remain.");
        }

        var result = await userManager.DeleteAsync(user);

        if (!result.Succeeded)
        {
            return Result.Failure(string.Join(" ", result.Errors.Select(e => e.Description)));
        }

        return Result.Success();
    }

    public async Task<Result> RequestPasswordResetAsync(
        string userId,
        CancellationToken cancellationToken = default)
    {
        var user = await userManager.FindByIdAsync(userId);

        if (user is null || string.IsNullOrEmpty(user.Email))
        {
            return Result.Failure("Administrator not found.");
        }

        var token = await userManager.GeneratePasswordResetTokenAsync(user);
        var link =
            $"{_emailSettings.FrontendBaseUrl}/auth/reset-password" +
            $"?email={Uri.EscapeDataString(user.Email)}&token={Uri.EscapeDataString(token)}";

        var body =
            $"<p>A password reset was requested for your ESN Gdańsk administrator account.</p>" +
            $"<p><a href=\"{link}\">Set a new password</a></p>" +
            $"<p>This link expires in 1 hour. If you didn't request this, you can ignore this email.</p>";

        await emailSender.SendAsync(user.Email, "Reset your ESN Gdańsk admin password", body, cancellationToken);

        return Result.Success();
    }

    public async Task<Result> ResetPasswordAsync(
        string email,
        string token,
        string newPassword,
        CancellationToken cancellationToken = default)
    {
        const string invalidOrExpiredMessage = "This reset link is invalid or has expired. Ask an administrator to send a new one.";

        var user = await userManager.FindByEmailAsync(email);

        if (user is null)
        {
            return Result.Failure(invalidOrExpiredMessage);
        }

        var result = await userManager.ResetPasswordAsync(user, token, newPassword);

        if (!result.Succeeded)
        {
            if (result.Errors.Any(error => error.Code == "InvalidToken"))
            {
                return Result.Failure(invalidOrExpiredMessage);
            }

            return Result.Failure(string.Join(" ", result.Errors.Select(e => e.Description)));
        }

        return Result.Success();
    }

    private async Task<Result<AuthResponse>> BuildAuthResponseAsync(ApplicationUser user)
    {
        var roles = await userManager.GetRolesAsync(user);
        var (token, expiresAt) = tokenService.CreateToken(user, roles);

        return Result.Success(new AuthResponse(token, expiresAt, user.Email ?? string.Empty));
    }
}
