using EsnApp.Application.Common;
using EsnApp.Application.Discounts.Common;
using MediatR;

namespace EsnApp.Application.Discounts.UpdateDiscount;

public record UpdateDiscountCommand(Guid Id, string Title, string Description) : IRequest<Result<DiscountDto>>;
