using EsnApp.Application.Common;
using MediatR;

namespace EsnApp.Application.Discounts.DeleteDiscount;

public record DeleteDiscountCommand(Guid Id) : IRequest<Result>;
