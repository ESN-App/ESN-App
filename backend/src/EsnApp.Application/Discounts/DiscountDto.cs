using EsnApp.Domain.Discounts;

namespace EsnApp.Application.Discounts;

public record DiscountDto(
    Guid Id,
    string Title,
    string Description,
    Guid PartnerId,
    string? PartnerName)
{
    public static DiscountDto FromEntity(Discount entity) => new(
        entity.Id,
        entity.Title,
        entity.Description,
        entity.PartnerId,
        entity.Partner?.Name);
}
