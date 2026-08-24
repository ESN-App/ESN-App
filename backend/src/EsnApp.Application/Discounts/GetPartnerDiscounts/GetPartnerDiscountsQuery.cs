using EsnApp.Application.Common;
using EsnApp.Application.Discounts.Common;
using MediatR;

namespace EsnApp.Application.Discounts.GetPartnerDiscounts;

public record GetPartnerDiscountsQuery(Guid PartnerId) : IRequest<Result<IReadOnlyList<DiscountDto>>>;
