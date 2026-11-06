namespace EsnApp.Application.Events.Common;

/// <summary>Admin view of an event: the public details plus who created and last edited it.</summary>
public record AdminEventDetailsDto : EventDetailsDto
{
    public AdminEventDetailsDto(EventDetailsDto details, string? createdBy, string? updatedBy)
        : base(details)
    {
        CreatedBy = createdBy;
        UpdatedBy = updatedBy;
    }

    /// <summary>Creator display name ("Jan K."); null for rows created before tracking.</summary>
    public string? CreatedBy { get; init; }

    /// <summary>Display name of the last admin who saved it (create, edit, status change; not reorder).</summary>
    public string? UpdatedBy { get; init; }
}
