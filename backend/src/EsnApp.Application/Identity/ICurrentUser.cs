namespace EsnApp.Application.Identity;

/// <summary>The authenticated user of the current request (null values when anonymous).</summary>
public interface ICurrentUser
{
    string? UserId { get; }

    /// <summary>Short display name, see <see cref="CreatorDisplayName.Format"/>.</summary>
    string? DisplayName { get; }
}
