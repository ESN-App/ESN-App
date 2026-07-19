using EsnApp.Domain.Discounts;

namespace EsnApp.Application.Discounts;

public record PartnerDto(
    Guid Id,
    string Name,
    string Description,
    string? WebsiteUrl)
{
    public static PartnerDto FromEntity(Partner entity) => new(
        entity.Id,
        entity.Name,
        entity.Description,
        entity.WebsiteUrl);
}
