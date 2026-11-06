namespace EsnApp.Application.Discounts.Common;

/// <summary>Admin view of a partner: the public fields plus who created it.</summary>
public record AdminPartnerDto : PartnerDto
{
    public AdminPartnerDto(PartnerDto partner, string? createdBy)
        : base(partner) => CreatedBy = createdBy;

    /// <summary>Creator display name ("Jan K."); null for rows created before tracking.</summary>
    public string? CreatedBy { get; init; }
}
