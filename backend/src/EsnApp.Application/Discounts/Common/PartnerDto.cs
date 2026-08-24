using EsnApp.Domain.Discounts;

namespace EsnApp.Application.Discounts.Common;

public record PartnerDto(
    Guid Id,
    string Name,
    string LogoPath,
    string ShortDescription,
    string Description,
    string? Address,
    string? WebsiteUrl,
    string? GoogleMapsUrl,
    decimal? Latitude,
    decimal? Longitude,
    PartnerStatus Status,
    int DisplayOrder,
    DateTimeOffset CreatedAt);
