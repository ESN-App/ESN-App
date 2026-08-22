using EsnApp.Application.Common;
using EsnApp.Application.Discounts.Common;
using MediatR;

namespace EsnApp.Application.Discounts.GetAdminDiscounts;

public record GetAdminDiscountsQuery : IRequest<Result<IReadOnlyList<DiscountDto>>>;
