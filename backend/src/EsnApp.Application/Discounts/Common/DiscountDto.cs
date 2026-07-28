namespace EsnApp.Application.Discounts.Common;

public record DiscountDto(
    Guid Id,
    string Title,
    string Description,
    Guid PartnerId,
    string? PartnerName);
