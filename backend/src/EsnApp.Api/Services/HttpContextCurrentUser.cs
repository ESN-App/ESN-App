using System.Security.Claims;
using EsnApp.Application.Identity;

namespace EsnApp.Api.Services;

/// <summary>Reads the current admin from the JWT claims (given_name/family_name/email).</summary>
public class HttpContextCurrentUser(IHttpContextAccessor httpContextAccessor) : ICurrentUser
{
    private ClaimsPrincipal? User => httpContextAccessor.HttpContext?.User;

    public string? UserId => User?.FindFirstValue(ClaimTypes.NameIdentifier);

    // Tokens issued before names existed lack given_name/family_name; the formatter then
    // falls back to the email local part until the admin logs in again.
    public string? DisplayName => User is null
        ? null
        : CreatorDisplayName.Format(
            User.FindFirstValue(ClaimTypes.GivenName),
            User.FindFirstValue(ClaimTypes.Surname),
            User.FindFirstValue(ClaimTypes.Email));
}
