using EsnApp.Application.Common;
using EsnApp.Application.Discounts.Common;
using MediatR;

namespace EsnApp.Application.Discounts.CreateDiscount;

public record CreateDiscountCommand(
    string Title,
    string Description,
    Guid PartnerId) : IRequest<Result<DiscountDto>>;
