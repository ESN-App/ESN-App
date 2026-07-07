using EsnApp.Application.Common;
using EsnApp.Application.Identity;
using Microsoft.AspNetCore.Identity;

namespace EsnApp.Infrastructure.Identity;

public class IdentityService(
    UserManager<ApplicationUser> userManager,
    JwtTokenService tokenService) : IIdentityService
{
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

    private async Task<Result<AuthResponse>> BuildAuthResponseAsync(ApplicationUser user)
    {
        var roles = await userManager.GetRolesAsync(user);
        var (token, expiresAt) = tokenService.CreateToken(user, roles);

        return Result.Success(new AuthResponse(token, expiresAt, user.Email ?? string.Empty));
    }
}
