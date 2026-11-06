namespace EsnApp.Application.Events.Common;

/// <summary>Admin view of an event: the public details plus who created it.</summary>
public record AdminEventDetailsDto : EventDetailsDto
{
    public AdminEventDetailsDto(EventDetailsDto details, string? createdBy)
        : base(details) => CreatedBy = createdBy;

    /// <summary>Creator display name ("Jan K."); null for rows created before tracking.</summary>
    public string? CreatedBy { get; init; }
}
