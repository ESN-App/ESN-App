using EsnApp.Application.Identity;

namespace EsnApp.Application.Tests.Common;

public sealed class FakeCurrentUser(string? userId = "admin-1", string? displayName = "Jan K.") : ICurrentUser
{
    public string? UserId { get; } = userId;

    public string? DisplayName { get; } = displayName;
}
