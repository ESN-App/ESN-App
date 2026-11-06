namespace EsnApp.Application.Discounts.Common;

/// <summary>Admin view of a partner: the public fields plus who created and last edited it.</summary>
public record AdminPartnerDto : PartnerDto
{
    public AdminPartnerDto(PartnerDto partner, string? createdBy, string? updatedBy, DateTimeOffset? updatedAt)
        : base(partner)
    {
        CreatedBy = createdBy;
        UpdatedBy = updatedBy;
        UpdatedAt = updatedAt;
    }

    /// <summary>Creator display name ("Jan K."); null for rows created before tracking.</summary>
    public string? CreatedBy { get; init; }

    /// <summary>Display name of the last admin who saved it (create, edit, status change; not reorder).</summary>
    public string? UpdatedBy { get; init; }

    /// <summary>Last edit time (admin-only; the public partner DTO does not expose it).</summary>
    public DateTimeOffset? UpdatedAt { get; init; }
}
