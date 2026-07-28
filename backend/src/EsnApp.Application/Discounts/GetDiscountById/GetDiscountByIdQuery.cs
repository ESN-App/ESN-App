using EsnApp.Application.Common;
using EsnApp.Application.Discounts.Common;
using MediatR;

namespace EsnApp.Application.Discounts.GetDiscountById;

public record GetDiscountByIdQuery(Guid Id) : IRequest<Result<DiscountDto>>;
