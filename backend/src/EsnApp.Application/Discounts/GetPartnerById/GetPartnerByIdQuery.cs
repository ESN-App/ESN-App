using EsnApp.Application.Common;
using EsnApp.Application.Discounts.Common;
using MediatR;

namespace EsnApp.Application.Discounts.GetPartnerById;

public record GetPartnerByIdQuery(Guid Id) : IRequest<Result<PartnerDto>>;
