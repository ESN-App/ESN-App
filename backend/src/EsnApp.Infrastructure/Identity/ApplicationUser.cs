using Microsoft.AspNetCore.Identity;

namespace EsnApp.Infrastructure.Identity;

public class ApplicationUser : IdentityUser
{
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
}
