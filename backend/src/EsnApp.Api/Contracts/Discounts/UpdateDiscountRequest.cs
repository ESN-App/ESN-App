namespace EsnApp.Api.Contracts.Discounts;

public class UpdateDiscountRequest
{
    public required string Title { get; init; }
    public required string Description { get; init; }
}
