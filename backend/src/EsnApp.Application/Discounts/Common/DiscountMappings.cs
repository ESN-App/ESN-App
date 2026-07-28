using EsnApp.Domain.Discounts;

namespace EsnApp.Application.Discounts.Common;

public static class DiscountMappings
{
    public static DiscountDto ToDto(this Discount entity) => new(
        entity.Id,
        entity.Title,
        entity.Description,
        entity.PartnerId,
        entity.Partner?.Name);
}
