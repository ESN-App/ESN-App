using EsnApp.Application.Common;
using EsnApp.Application.Discounts.Common;
using MediatR;

namespace EsnApp.Application.Discounts.GetDiscountsList;

public record GetDiscountsListQuery : IRequest<Result<IReadOnlyList<DiscountDto>>>;
